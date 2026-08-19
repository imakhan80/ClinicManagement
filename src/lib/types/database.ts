export type Role = "admin" | "doctor" | "nurse" | "receptionist";
export type Gender = "male" | "female" | "other";
export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type QueueStatus = "waiting" | "triaged" | "ready" | "in_consult" | "completed" | "cancelled";
export type QueuePriority = "normal" | "urgent";
export type InvestigationCategory = "lab" | "imaging" | "other";
export type InvestigationStatus = "ordered" | "in_progress" | "completed" | "cancelled";
export type PrescriptionStatus = "pending" | "partially_dispensed" | "dispensed" | "cancelled";
export type FollowUpStatus = "pending" | "scheduled" | "completed" | "cancelled";
export type InvoiceStatus = "draft" | "issued" | "paid" | "partially_paid" | "void";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "insurance" | "other";
export type MedicalRecordStatus = "draft" | "completed";
export type InventoryMovementReason = "received" | "procedure_use" | "adjustment" | "wastage";
export type ProcedureOrderStatus = "ordered" | "completed" | "cancelled";
export type InsuranceClaimStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: Role;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: Role;
          phone?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<{
          full_name: string;
          role: Role;
          phone: string | null;
          avatar_url: string | null;
        }>;
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          mrn: string;
          full_name: string;
          date_of_birth: string;
          gender: Gender | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          blood_type: string | null;
          allergies: string[];
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mrn?: string;
          full_name: string;
          date_of_birth: string;
          gender?: Gender | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          blood_type?: string | null;
          allergies?: string[];
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string | null;
          scheduled_at: string;
          duration_minutes: number;
          ends_at: string;
          status: AppointmentStatus;
          reason: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          status?: AppointmentStatus;
          reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_records: {
        Row: {
          id: string;
          appointment_id: string | null;
          patient_id: string;
          doctor_id: string;
          diagnosis: string | null;
          prescription: string | null;
          attachments: unknown[];
          chief_complaint: string | null;
          vitals_snapshot: Record<string, unknown> | null;
          soap_subjective: string | null;
          soap_objective: string | null;
          soap_plan: string | null;
          status: MedicalRecordStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          patient_id: string;
          doctor_id: string;
          diagnosis?: string | null;
          prescription?: string | null;
          attachments?: unknown[];
          chief_complaint?: string | null;
          vitals_snapshot?: Record<string, unknown> | null;
          soap_subjective?: string | null;
          soap_objective?: string | null;
          soap_plan?: string | null;
          status?: MedicalRecordStatus;
        };
        Update: Partial<Database["public"]["Tables"]["medical_records"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: true;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          patient_id: string;
          appointment_id: string | null;
          status: InvoiceStatus;
          subtotal: number;
          tax: number;
          discount: number;
          total: number;
          due_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: string;
          patient_id: string;
          appointment_id?: string | null;
          status?: InvoiceStatus;
          subtotal?: number;
          tax?: number;
          discount?: number;
          total?: number;
          due_date?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invoices_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          method: PaymentMethod;
          paid_at: string;
          recorded_by: string | null;
          is_refund: boolean;
          note: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          amount: number;
          method: PaymentMethod;
          paid_at?: string;
          recorded_by?: string | null;
          is_refund?: boolean;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      queue_entries: {
        Row: {
          id: string;
          appointment_id: string;
          patient_id: string;
          queue_number: number;
          priority: QueuePriority;
          status: QueueStatus;
          checked_in_at: string;
          called_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          patient_id: string;
          queue_number: number;
          priority?: QueuePriority;
          status?: QueueStatus;
          checked_in_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["queue_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "queue_entries_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_entries_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      triage_records: {
        Row: {
          id: string;
          appointment_id: string;
          patient_id: string;
          taken_by: string | null;
          bp_systolic: number | null;
          bp_diastolic: number | null;
          pulse_bpm: number | null;
          temperature_c: number | null;
          respiratory_rate: number | null;
          spo2: number | null;
          weight_kg: number | null;
          height_cm: number | null;
          bmi: number | null;
          pain_score: number | null;
          chief_complaint: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          patient_id: string;
          taken_by?: string | null;
          bp_systolic?: number | null;
          bp_diastolic?: number | null;
          pulse_bpm?: number | null;
          temperature_c?: number | null;
          respiratory_rate?: number | null;
          spo2?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          pain_score?: number | null;
          chief_complaint?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["triage_records"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "triage_records_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      investigations: {
        Row: {
          id: string;
          appointment_id: string | null;
          patient_id: string;
          ordered_by: string;
          category: InvestigationCategory;
          test_name: string;
          status: InvestigationStatus;
          result_text: string | null;
          result_attachments: unknown[];
          ordered_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          patient_id: string;
          ordered_by: string;
          category: InvestigationCategory;
          test_name: string;
          status?: InvestigationStatus;
          result_text?: string | null;
          result_attachments?: unknown[];
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["investigations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "investigations_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      prescriptions: {
        Row: {
          id: string;
          appointment_id: string | null;
          patient_id: string;
          doctor_id: string;
          status: PrescriptionStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          patient_id: string;
          doctor_id: string;
          status?: PrescriptionStatus;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["prescriptions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      prescription_items: {
        Row: {
          id: string;
          prescription_id: string;
          medication_name: string;
          dosage: string | null;
          frequency: string | null;
          duration: string | null;
          quantity: number;
          instructions: string | null;
          quantity_dispensed: number;
        };
        Insert: {
          id?: string;
          prescription_id: string;
          medication_name: string;
          dosage?: string | null;
          frequency?: string | null;
          duration?: string | null;
          quantity?: number;
          instructions?: string | null;
          quantity_dispensed?: number;
        };
        Update: Partial<Database["public"]["Tables"]["prescription_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey";
            columns: ["prescription_id"];
            isOneToOne: false;
            referencedRelation: "prescriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      medications: {
        Row: {
          id: string;
          name: string;
          form: string | null;
          strength: string | null;
          unit_price: number;
          stock_quantity: number;
          reorder_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          form?: string | null;
          strength?: string | null;
          unit_price?: number;
          stock_quantity?: number;
          reorder_level?: number;
        };
        Update: Partial<Database["public"]["Tables"]["medications"]["Insert"]>;
        Relationships: [];
      };
      dispenses: {
        Row: {
          id: string;
          prescription_item_id: string;
          medication_id: string | null;
          quantity_dispensed: number;
          dispensed_by: string | null;
          dispensed_at: string;
        };
        Insert: {
          id?: string;
          prescription_item_id: string;
          medication_id?: string | null;
          quantity_dispensed: number;
          dispensed_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["dispenses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dispenses_prescription_item_id_fkey";
            columns: ["prescription_item_id"];
            isOneToOne: false;
            referencedRelation: "prescription_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dispenses_medication_id_fkey";
            columns: ["medication_id"];
            isOneToOne: false;
            referencedRelation: "medications";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_ups: {
        Row: {
          id: string;
          patient_id: string;
          appointment_id: string | null;
          doctor_id: string | null;
          recommended_date: string;
          reason: string | null;
          status: FollowUpStatus;
          scheduled_appointment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          appointment_id?: string | null;
          doctor_id?: string | null;
          recommended_date: string;
          reason?: string | null;
          status?: FollowUpStatus;
          scheduled_appointment_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["follow_ups"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "follow_ups_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      clinical_note_templates: {
        Row: {
          id: string;
          created_by: string;
          name: string;
          subjective: string | null;
          objective: string | null;
          assessment: string | null;
          plan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          name: string;
          subjective?: string | null;
          objective?: string | null;
          assessment?: string | null;
          plan?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clinical_note_templates"]["Insert"]>;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          unit: string | null;
          unit_cost: number;
          stock_quantity: number;
          reorder_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          unit?: string | null;
          unit_cost?: number;
          stock_quantity?: number;
          reorder_level?: number;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          item_id: string;
          change_qty: number;
          reason: InventoryMovementReason;
          reference_type: string | null;
          reference_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          change_qty: number;
          reason: InventoryMovementReason;
          reference_type?: string | null;
          reference_id?: string | null;
          note?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_movements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      procedure_catalog: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          default_price: number;
          default_duration_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          default_price?: number;
          default_duration_minutes?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["procedure_catalog"]["Insert"]>;
        Relationships: [];
      };
      procedure_consumables: {
        Row: {
          id: string;
          procedure_id: string;
          inventory_item_id: string;
          quantity_per_procedure: number;
        };
        Insert: {
          id?: string;
          procedure_id: string;
          inventory_item_id: string;
          quantity_per_procedure?: number;
        };
        Update: Partial<Database["public"]["Tables"]["procedure_consumables"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "procedure_consumables_procedure_id_fkey";
            columns: ["procedure_id"];
            isOneToOne: false;
            referencedRelation: "procedure_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procedure_consumables_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      procedure_orders: {
        Row: {
          id: string;
          appointment_id: string | null;
          patient_id: string;
          procedure_id: string | null;
          procedure_name: string;
          price: number;
          ordered_by: string;
          performed_by: string | null;
          status: ProcedureOrderStatus;
          invoice_id: string | null;
          notes: string | null;
          ordered_at: string;
          performed_at: string | null;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          patient_id: string;
          procedure_id?: string | null;
          procedure_name: string;
          price?: number;
          ordered_by: string;
          performed_by?: string | null;
          status?: ProcedureOrderStatus;
          invoice_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["procedure_orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "procedure_orders_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procedure_orders_procedure_id_fkey";
            columns: ["procedure_id"];
            isOneToOne: false;
            referencedRelation: "procedure_catalog";
            referencedColumns: ["id"];
          },
        ];
      };
      insurance_providers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["insurance_providers"]["Insert"]>;
        Relationships: [];
      };
      patient_insurance_policies: {
        Row: {
          id: string;
          patient_id: string;
          provider_id: string;
          policy_number: string;
          group_number: string | null;
          coverage_percent: number;
          is_primary: boolean;
          valid_from: string | null;
          valid_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          provider_id: string;
          policy_number: string;
          group_number?: string | null;
          coverage_percent?: number;
          is_primary?: boolean;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["patient_insurance_policies"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "patient_insurance_policies_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "insurance_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      insurance_claims: {
        Row: {
          id: string;
          invoice_id: string;
          policy_id: string;
          status: InsuranceClaimStatus;
          claimed_amount: number;
          approved_amount: number | null;
          submitted_at: string | null;
          decided_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          policy_id: string;
          status?: InsuranceClaimStatus;
          claimed_amount: number;
          approved_amount?: number | null;
          submitted_at?: string | null;
          decided_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["insurance_claims"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "insurance_claims_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey";
            columns: ["policy_id"];
            isOneToOne: false;
            referencedRelation: "patient_insurance_policies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      dispense_prescription_item: {
        Args: { p_item_id: string; p_quantity: number };
        Returns: Database["public"]["Tables"]["dispenses"]["Row"];
      };
      complete_procedure_order: {
        Args: { p_order_id: string };
        Returns: Database["public"]["Tables"]["procedure_orders"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
