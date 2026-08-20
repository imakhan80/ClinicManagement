// One-off seed script: populates realistic demo data across every module
// (patients, appointments, queue, triage, investigations, prescriptions,
// pharmacy, procedures, inventory, insurance, billing, follow-ups,
// communications) using the service-role key, bypassing RLS.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. Usage: node scripts/seed-demo-data.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  const envPath = path.join(rootDir, ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function must(label, { data, error }) {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}
function daysFromNow(n, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function dateStr(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const profiles = must("profiles", await db.from("profiles").select("id, role, full_name"));
const byRole = (r) => profiles.find((p) => p.role === r);
const admin = byRole("admin");
const doctor = byRole("doctor");
const nurse = byRole("nurse");
const receptionist = byRole("receptionist");
if (!admin || !doctor || !nurse || !receptionist) {
  console.error("Missing one or more demo role profiles — run `npm run seed:demo` first.");
  process.exit(1);
}

console.log("Seeding patients...");
const patientRows = [
  { full_name: "Amara Okafor", date_of_birth: "1990-04-12", gender: "female", phone: "+1 555 010 1001", email: "amara.okafor@example.com", allergies: ["Penicillin"], created_by: receptionist.id },
  { full_name: "Liam Chen", date_of_birth: "1985-11-02", gender: "male", phone: "+1 555 010 1002", email: "liam.chen@example.com", allergies: [], created_by: receptionist.id },
  { full_name: "Priya Nair", date_of_birth: "2001-07-23", gender: "female", phone: "+1 555 010 1003", email: "priya.nair@example.com", allergies: ["Latex"], created_by: receptionist.id },
  { full_name: "Marcus Bell", date_of_birth: "1972-01-30", gender: "male", phone: "+1 555 010 1004", email: "marcus.bell@example.com", allergies: [], blood_type: "O+", created_by: receptionist.id },
  { full_name: "Sofia Rossi", date_of_birth: "1996-09-15", gender: "female", phone: "+1 555 010 1005", email: "sofia.rossi@example.com", allergies: ["Sulfa drugs"], created_by: receptionist.id },
  { full_name: "David Okoro", date_of_birth: "1960-03-08", gender: "male", phone: "+1 555 010 1006", email: "david.okoro@example.com", allergies: [], blood_type: "A-", created_by: receptionist.id },
];
const patients = must("patients", await db.from("patients").insert(patientRows).select("id, full_name"));
const p = Object.fromEntries(patients.map((x) => [x.full_name, x.id]));

console.log("Seeding medications (pharmacy)...");
const meds = must("medications", await db.from("medications").insert([
  { name: "Amoxicillin", form: "Capsule", strength: "500mg", unit_price: 0.85, stock_quantity: 240, reorder_level: 50 },
  { name: "Ibuprofen", form: "Tablet", strength: "400mg", unit_price: 0.25, stock_quantity: 12, reorder_level: 40 },
  { name: "Metformin", form: "Tablet", strength: "500mg", unit_price: 0.4, stock_quantity: 300, reorder_level: 60 },
  { name: "Amlodipine", form: "Tablet", strength: "5mg", unit_price: 0.5, stock_quantity: 8, reorder_level: 30 },
  { name: "Salbutamol Inhaler", form: "Inhaler", strength: "100mcg", unit_price: 6.5, stock_quantity: 25, reorder_level: 10 },
]).select("id, name"));
const med = Object.fromEntries(meds.map((x) => [x.name, x.id]));

console.log("Seeding inventory items...");
const invItems = must("inventory_items", await db.from("inventory_items").insert([
  { name: "Nitrile Gloves (Box)", category: "PPE", unit: "Box", unit_cost: 8.5, stock_quantity: 40, reorder_level: 15 },
  { name: "Syringes 5ml", category: "Consumable", unit: "Pack", unit_cost: 4.2, stock_quantity: 5, reorder_level: 20 },
  { name: "Gauze Roll", category: "Wound care", unit: "Roll", unit_cost: 1.1, stock_quantity: 60, reorder_level: 20 },
  { name: "Suture Kit", category: "Minor surgery", unit: "Kit", unit_cost: 12, stock_quantity: 18, reorder_level: 8 },
  { name: "Alcohol Swabs", category: "Consumable", unit: "Box", unit_cost: 3.0, stock_quantity: 90, reorder_level: 25 },
]).select("id, name"));
const invItem = Object.fromEntries(invItems.map((x) => [x.name, x.id]));

console.log("Seeding procedure catalog + consumables...");
const procCatalog = must("procedure_catalog", await db.from("procedure_catalog").insert([
  { name: "Wound Dressing", category: "Minor procedure", default_price: 35, default_duration_minutes: 15 },
  { name: "Suturing (small laceration)", category: "Minor surgery", default_price: 120, default_duration_minutes: 30 },
  { name: "ECG", category: "Diagnostic", default_price: 60, default_duration_minutes: 15 },
  { name: "Nebulization", category: "Respiratory", default_price: 45, default_duration_minutes: 20 },
]).select("id, name"));
const proc = Object.fromEntries(procCatalog.map((x) => [x.name, x.id]));
await db.from("procedure_consumables").insert([
  { procedure_id: proc["Wound Dressing"], inventory_item_id: invItem["Gauze Roll"], quantity_per_procedure: 2 },
  { procedure_id: proc["Suturing (small laceration)"], inventory_item_id: invItem["Suture Kit"], quantity_per_procedure: 1 },
]);

console.log("Seeding insurance providers + policies...");
const providers = must("insurance_providers", await db.from("insurance_providers").insert([
  { name: "Blue Shield Health", phone: "+1 800 555 2000", email: "claims@blueshield.example" },
  { name: "Unity Care Insurance", phone: "+1 800 555 3000", email: "claims@unitycare.example" },
]).select("id, name"));
const providerId = Object.fromEntries(providers.map((x) => [x.name, x.id]));
const policies = must("policies", await db.from("patient_insurance_policies").insert([
  { patient_id: p["Amara Okafor"], provider_id: providerId["Blue Shield Health"], policy_number: "BSH-88213", coverage_percent: 80, is_primary: true },
  { patient_id: p["Marcus Bell"], provider_id: providerId["Unity Care Insurance"], policy_number: "UCI-44120", coverage_percent: 70, is_primary: true },
]).select("id, patient_id"));

console.log("Seeding communication templates + logs...");
const templates = must("templates", await db.from("communication_templates").insert([
  { name: "Appointment reminder", channel: "sms", body: "Hi {{name}}, this is a reminder of your upcoming appointment. Reply CONFIRM to confirm." },
  { name: "Lab results ready", channel: "call", body: "Called to let the patient know their lab results are ready for review." },
  { name: "Follow-up overdue", channel: "email", subject: "Time for a follow-up visit", body: "Our records show your recommended follow-up visit is overdue — please call to schedule." },
]).select("id"));
await db.from("communication_logs").insert([
  { patient_id: p["Amara Okafor"], channel: "sms", direction: "outbound", body: "Reminder sent for upcoming appointment.", template_id: templates[0].id, logged_by: receptionist.id },
  { patient_id: p["Liam Chen"], channel: "call", direction: "inbound", body: "Patient called to reschedule; advised to use online booking.", logged_by: receptionist.id },
]);

console.log("Seeding appointments (past, today, future)...");
const appts = must("appointments", await db.from("appointments").insert([
  { patient_id: p["Amara Okafor"], doctor_id: doctor.id, scheduled_at: daysFromNow(-14, 10), duration_minutes: 30, status: "completed", reason: "Annual checkup", created_by: receptionist.id },
  { patient_id: p["Liam Chen"], doctor_id: doctor.id, scheduled_at: daysFromNow(-3, 11), duration_minutes: 30, status: "completed", reason: "Persistent cough", created_by: receptionist.id },
  { patient_id: p["Priya Nair"], doctor_id: doctor.id, scheduled_at: daysFromNow(0, 14), duration_minutes: 30, status: "scheduled", reason: "Skin rash", created_by: receptionist.id },
  { patient_id: p["Marcus Bell"], doctor_id: doctor.id, scheduled_at: daysFromNow(0, 15, 30), duration_minutes: 30, status: "checked_in", reason: "Blood pressure review", created_by: receptionist.id },
  { patient_id: p["Sofia Rossi"], doctor_id: doctor.id, scheduled_at: daysFromNow(2, 9, 30), duration_minutes: 30, status: "scheduled", reason: "Follow-up bloodwork", created_by: receptionist.id },
  { patient_id: p["David Okoro"], doctor_id: doctor.id, scheduled_at: daysFromNow(5, 13), duration_minutes: 45, status: "scheduled", reason: "Cardiology referral discussion", created_by: receptionist.id },
]).select("id, patient_id, status"));
const apptByPatient = Object.fromEntries(appts.map((a) => [a.patient_id, a]));

console.log("Seeding queue entry for the checked-in patient...");
const checkedIn = apptByPatient[p["Marcus Bell"]];
await db.from("queue_entries").insert([
  { appointment_id: checkedIn.id, patient_id: p["Marcus Bell"], queue_number: 1, status: "waiting" },
]);

console.log("Seeding triage record + investigations for the completed visits...");
const completedAmara = apptByPatient[p["Amara Okafor"]];
const completedLiam = apptByPatient[p["Liam Chen"]];
await db.from("triage_records").insert([
  {
    appointment_id: completedAmara.id, patient_id: p["Amara Okafor"], taken_by: nurse.id,
    bp_systolic: 118, bp_diastolic: 76, pulse_bpm: 72, temperature_c: 36.8, respiratory_rate: 16,
    spo2: 98, weight_kg: 63.5, height_cm: 165, pain_score: 0, chief_complaint: "Routine annual checkup",
  },
]);
must("investigations", await db.from("investigations").insert([
  { appointment_id: completedLiam.id, patient_id: p["Liam Chen"], ordered_by: doctor.id, category: "lab", test_name: "Chest X-ray", status: "ordered" },
  { appointment_id: completedLiam.id, patient_id: p["Liam Chen"], ordered_by: doctor.id, category: "lab", test_name: "CBC Panel", status: "in_progress" },
  { appointment_id: completedAmara.id, patient_id: p["Amara Okafor"], ordered_by: doctor.id, category: "lab", test_name: "Lipid Panel", status: "completed", result_text: "Within normal limits.", completed_at: daysFromNow(-13) },
]));

console.log("Seeding prescriptions...");
const rx1 = must("rx1", await db.from("prescriptions").insert({
  appointment_id: completedLiam.id, patient_id: p["Liam Chen"], doctor_id: doctor.id, status: "pending",
}).select("id").single());
must("rx1 items", await db.from("prescription_items").insert([
  { prescription_id: rx1.id, medication_name: "Amoxicillin", dosage: "500mg", frequency: "3x daily", duration: "7 days", quantity: 21, instructions: "Take with food" },
]));
const rx2 = must("rx2", await db.from("prescriptions").insert({
  appointment_id: completedAmara.id, patient_id: p["Amara Okafor"], doctor_id: doctor.id, status: "dispensed",
}).select("id").single());
const rx2Item = must("rx2 items", await db.from("prescription_items").insert({
  prescription_id: rx2.id, medication_name: "Ibuprofen", dosage: "400mg", frequency: "2x daily", duration: "5 days", quantity: 10,
}).select("id").single());
await db.from("dispenses").insert({ prescription_item_id: rx2Item.id, medication_id: med["Ibuprofen"], quantity_dispensed: 10, dispensed_by: nurse.id });

console.log("Seeding procedure orders...");
must("procedure orders", await db.from("procedure_orders").insert([
  { appointment_id: completedAmara.id, patient_id: p["Amara Okafor"], procedure_id: proc["ECG"], procedure_name: "ECG", price: 60, ordered_by: doctor.id, performed_by: doctor.id, status: "completed", performed_at: daysFromNow(-14) },
  { appointment_id: completedLiam.id, patient_id: p["Liam Chen"], procedure_id: proc["Nebulization"], procedure_name: "Nebulization", price: 45, ordered_by: doctor.id, status: "ordered" },
]));

console.log("Seeding invoices, items, payments, and an insurance claim...");
const inv1 = must("inv1", await db.from("invoices").insert({
  patient_id: p["Amara Okafor"], appointment_id: completedAmara.id, subtotal: 145, tax: 0, discount: 0, total: 145,
  status: "issued", due_date: dateStr(10), created_by: receptionist.id,
}).select("id").single());
await db.from("invoice_items").insert([
  { invoice_id: inv1.id, description: "Consultation", quantity: 1, unit_price: 85 },
  { invoice_id: inv1.id, description: "ECG", quantity: 1, unit_price: 60 },
]);
const policyAmara = policies.find((pol) => pol.patient_id === p["Amara Okafor"]);
await db.from("insurance_claims").insert({
  invoice_id: inv1.id, policy_id: policyAmara.id, status: "submitted", claimed_amount: 116, submitted_at: daysFromNow(-1), created_by: receptionist.id,
});

const inv2 = must("inv2", await db.from("invoices").insert({
  patient_id: p["Liam Chen"], appointment_id: completedLiam.id, subtotal: 130, tax: 0, discount: 10, total: 120,
  status: "partially_paid", due_date: dateStr(7), created_by: receptionist.id,
}).select("id").single());
await db.from("invoice_items").insert([
  { invoice_id: inv2.id, description: "Consultation", quantity: 1, unit_price: 85 },
  { invoice_id: inv2.id, description: "Nebulization", quantity: 1, unit_price: 45 },
]);
await db.from("payments").insert({ invoice_id: inv2.id, amount: 60, method: "card", recorded_by: receptionist.id });

const inv3 = must("inv3", await db.from("invoices").insert({
  patient_id: p["David Okoro"], subtotal: 200, tax: 0, discount: 0, total: 200,
  status: "issued", due_date: dateStr(-5), created_by: receptionist.id,
}).select("id").single());
await db.from("invoice_items").insert({ invoice_id: inv3.id, description: "Specialist referral consult", quantity: 1, unit_price: 200 });

const inv4 = must("inv4", await db.from("invoices").insert({
  patient_id: p["Sofia Rossi"], subtotal: 90, tax: 0, discount: 0, total: 90,
  status: "paid", due_date: dateStr(3), created_by: receptionist.id,
}).select("id").single());
await db.from("invoice_items").insert({ invoice_id: inv4.id, description: "Bloodwork panel", quantity: 1, unit_price: 90 });
await db.from("payments").insert({ invoice_id: inv4.id, amount: 90, method: "cash", recorded_by: receptionist.id });

console.log("Seeding follow-ups...");
await db.from("follow_ups").insert([
  { patient_id: p["Liam Chen"], appointment_id: completedLiam.id, doctor_id: doctor.id, recommended_date: dateStr(-2), reason: "Recheck cough resolution", status: "pending" },
  { patient_id: p["Amara Okafor"], appointment_id: completedAmara.id, doctor_id: doctor.id, recommended_date: dateStr(20), reason: "Annual bloodwork", status: "pending" },
  { patient_id: p["David Okoro"], doctor_id: doctor.id, recommended_date: dateStr(-10), reason: "BP recheck", status: "cancelled" },
]);

console.log("\nDone. Seeded patients, appointments, queue, triage, investigations,");
console.log("prescriptions/dispenses, procedures, inventory, insurance, invoices/");
console.log("payments/claims, follow-ups, and communications.");
