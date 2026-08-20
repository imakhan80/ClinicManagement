"use server";

import { GoogleGenAI, FunctionCallingConfigMode, type Content, type FunctionDeclaration } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { formatDate as fmtDate } from "date-fns";
import type { AppointmentStatus } from "@/lib/types/database";

const MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `You are the clinic operations assistant embedded in "Clinic OS", a clinic management app.
You have read-only access to the clinic's live data through the tools provided — always call a tool to get real numbers
before answering a data question, and never invent figures. Keep answers short and to the point (a sentence or a short
list), formatted in plain text (no markdown tables).
You are NOT a clinical decision-support tool: never give a medical diagnosis, treatment, or dosing advice. If asked for
that, say it's outside what you can help with and suggest the doctor/clinical team. Stay focused on clinic operations,
scheduling, billing, and inventory questions.`;

const TOOLS: FunctionDeclaration[] = [
  {
    name: "get_today_overview",
    description: "Get a snapshot of today's clinic activity: appointments, patients waiting, revenue, and alerts.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "search_patients",
    description: "Search patients by name or MRN.",
    parametersJsonSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Name or MRN to search for" } },
      required: ["query"],
    },
  },
  {
    name: "get_appointments",
    description: "List appointments for a given date (defaults to today), optionally filtered by status.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format, defaults to today" },
        status: {
          type: "string",
          enum: ["scheduled", "checked_in", "in_progress", "completed", "cancelled", "no_show"],
        },
      },
    },
  },
  {
    name: "get_billing_summary",
    description: "Get invoice totals by status, and a list of overdue invoices.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "get_inventory_status",
    description: "Get medication and supply stock levels, optionally only items low on stock.",
    parametersJsonSchema: {
      type: "object",
      properties: { lowStockOnly: { type: "boolean" } },
    },
  },
  {
    name: "get_follow_ups",
    description: "List patient follow-ups, optionally only overdue ones.",
    parametersJsonSchema: {
      type: "object",
      properties: { overdueOnly: { type: "boolean" } },
    },
  },
];

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const supabase = await createClient();
  const todayStr = fmtDate(new Date(), "yyyy-MM-dd");
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  switch (name) {
    case "get_today_overview": {
      const [
        { count: appointmentsToday },
        { count: waitingPatients },
        { data: paymentsToday },
        { data: medications },
        { data: inventoryItems },
        { count: overdueInvoices },
        { count: overdueFollowUps },
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_at", startOfDay.toISOString())
          .lte("scheduled_at", endOfDay.toISOString()),
        supabase
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .eq("status", "waiting"),
        supabase.from("payments").select("amount, is_refund").gte("paid_at", startOfDay.toISOString()),
        supabase.from("medications").select("stock_quantity, reorder_level"),
        supabase.from("inventory_items").select("stock_quantity, reorder_level"),
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .in("status", ["issued", "partially_paid"])
          .lt("due_date", todayStr),
        supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .lt("recommended_date", todayStr),
      ]);
      const revenueToday = (paymentsToday ?? []).reduce(
        (sum, p) => sum + (p.is_refund ? -Number(p.amount) : Number(p.amount)),
        0
      );
      const lowStockMedications = (medications ?? []).filter((m) => m.stock_quantity <= m.reorder_level).length;
      const lowStockSupplies = (inventoryItems ?? []).filter((i) => i.stock_quantity <= i.reorder_level).length;
      return {
        appointmentsToday: appointmentsToday ?? 0,
        waitingPatients: waitingPatients ?? 0,
        revenueToday,
        lowStockMedications,
        lowStockSupplies,
        overdueInvoices: overdueInvoices ?? 0,
        overdueFollowUps: overdueFollowUps ?? 0,
      };
    }

    case "search_patients": {
      const query = String(args.query ?? "");
      const [{ data: byName }, { data: byMrn }] = await Promise.all([
        supabase
          .from("patients")
          .select("id, full_name, mrn, phone, date_of_birth")
          .ilike("full_name", `%${query}%`)
          .limit(10),
        supabase
          .from("patients")
          .select("id, full_name, mrn, phone, date_of_birth")
          .ilike("mrn", `%${query}%`)
          .limit(10),
      ]);
      const seen = new Set<string>();
      const results = [...(byName ?? []), ...(byMrn ?? [])].filter((p) =>
        seen.has(p.id) ? false : (seen.add(p.id), true)
      );
      return { results };
    }

    case "get_appointments": {
      const date = typeof args.date === "string" && args.date ? args.date : todayStr;
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(`${date}T23:59:59`);
      let query = supabase
        .from("appointments")
        .select("scheduled_at, status, reason, patients(full_name), doctor:profiles!doctor_id(full_name)")
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString())
        .order("scheduled_at", { ascending: true });
      if (typeof args.status === "string" && args.status) {
        query = query.eq("status", args.status as AppointmentStatus);
      }
      const { data } = await query;
      return {
        date,
        appointments: (data ?? []).map((a) => {
          const patient = Array.isArray(a.patients) ? a.patients[0] : a.patients;
          const doctor = Array.isArray(a.doctor) ? a.doctor[0] : a.doctor;
          return {
            time: a.scheduled_at,
            status: a.status,
            reason: a.reason,
            patient: patient?.full_name,
            doctor: doctor?.full_name,
          };
        }),
      };
    }

    case "get_billing_summary": {
      const [{ data: invoices }, { data: overdueRows }] = await Promise.all([
        supabase.from("invoices").select("status, total"),
        supabase
          .from("invoices")
          .select("invoice_number, total, due_date, patients(full_name)")
          .in("status", ["issued", "partially_paid"])
          .lt("due_date", todayStr)
          .order("due_date", { ascending: true })
          .limit(10),
      ]);
      const byStatus = new Map<string, { count: number; total: number }>();
      for (const inv of invoices ?? []) {
        const entry = byStatus.get(inv.status) ?? { count: 0, total: 0 };
        entry.count += 1;
        entry.total += Number(inv.total);
        byStatus.set(inv.status, entry);
      }
      return {
        byStatus: Object.fromEntries(byStatus),
        overdueInvoices: (overdueRows ?? []).map((inv) => {
          const patient = Array.isArray(inv.patients) ? inv.patients[0] : inv.patients;
          return {
            invoiceNumber: inv.invoice_number,
            total: Number(inv.total),
            dueDate: inv.due_date,
            patient: patient?.full_name,
          };
        }),
      };
    }

    case "get_inventory_status": {
      const lowStockOnly = args.lowStockOnly === true;
      const [{ data: medications }, { data: inventoryItems }] = await Promise.all([
        supabase.from("medications").select("name, stock_quantity, reorder_level"),
        supabase.from("inventory_items").select("name, stock_quantity, reorder_level"),
      ]);
      const filterFn = (i: { stock_quantity: number; reorder_level: number }) =>
        !lowStockOnly || i.stock_quantity <= i.reorder_level;
      return {
        medications: (medications ?? []).filter(filterFn),
        supplies: (inventoryItems ?? []).filter(filterFn),
      };
    }

    case "get_follow_ups": {
      const overdueOnly = args.overdueOnly === true;
      let query = supabase
        .from("follow_ups")
        .select("recommended_date, status, reason, patients(full_name)")
        .order("recommended_date", { ascending: true })
        .limit(15);
      if (overdueOnly) {
        query = query.eq("status", "pending").lt("recommended_date", todayStr);
      }
      const { data } = await query;
      return {
        followUps: (data ?? []).map((f) => {
          const patient = Array.isArray(f.patients) ? f.patients[0] : f.patients;
          return {
            date: f.recommended_date,
            status: f.status,
            reason: f.reason,
            patient: patient?.full_name,
          };
        }),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export interface AssistantMessage {
  role: "user" | "model";
  text: string;
}

export interface AskAssistantResult {
  answer?: string;
  error?: string;
}

export async function askAssistant(
  history: AssistantMessage[],
  question: string
): Promise<AskAssistantResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "AI Assistant isn't configured (missing GEMINI_API_KEY)." };
  if (!question.trim()) return { error: "Ask a question first." };

  const ai = new GoogleGenAI({ apiKey });
  const contents: Content[] = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: "user", parts: [{ text: question }] },
  ];

  try {
    for (let iteration = 0; iteration < 6; iteration++) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOLS }],
          toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
        },
      });

      const calls = response.functionCalls;
      if (!calls || calls.length === 0) {
        return { answer: response.text ?? "I don't have an answer for that." };
      }

      contents.push({
        role: "model",
        parts: calls.map((call) => ({ functionCall: call })),
      });

      const results = await Promise.all(
        calls.map(async (call) => ({
          name: call.name ?? "",
          response: { result: await executeTool(call.name ?? "", (call.args ?? {}) as Record<string, unknown>) },
        }))
      );

      contents.push({
        role: "user",
        parts: results.map((r) => ({ functionResponse: { name: r.name, response: r.response } })),
      });
    }
    return { error: "That took too many steps to answer — try a more specific question." };
  } catch {
    return { error: "The AI Assistant is temporarily unavailable. Try again in a moment." };
  }
}
