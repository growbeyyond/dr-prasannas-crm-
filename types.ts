export type Role = 'admin' | 'doctor' | 'receptionist';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type FollowupStatus = 'pending' | 'done' | 'snoozed' | 'canceled';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface Recurrence {
  type: RecurrenceType;
  interval: number;
  days?: number[]; // for weekly
}

export interface Branch {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  role: Role;
  branch_id?: number;
}

export interface Patient {
  id: number;
  name: string;
  phone: string;
  dob?: string;
  gender?: string;
}

export interface Followup {
  id: number;
  patient: Patient;
  doctor_id: number;
  branch_id: number;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:MM:SS
  status: FollowupStatus;
  priority: Priority;
  recurrence?: Recurrence;
  notes?: string;
  created_by: number;
}

export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

export interface Vitals {
    bp: string; // e.g., "120/80"
    temp: number; // Celsius
    weight: number; // kg
}

export interface PrescriptionItem {
    id: number;
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'checked_in' | 'in_consult' | 'completed' | 'canceled';
export type InvoiceStatus = 'pending' | 'paid';

export interface Invoice {
    id: number;
    appointment_id: number;
    service_name: string;
    amount: number;
    status: InvoiceStatus;
    patient_name: string;
    invoice_date: string;
}

export interface Appointment {
  id: number;
  branch_id: number;
  doctor_id: number;
  patient_id: number;
  patient: Patient;
  service_id: number;
  service_name: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  status: AppointmentStatus;
  vitals?: Vitals;
  notes?: string;
  prescription?: PrescriptionItem[];
  invoice_id?: number;
}

export type HistoryItem = 
  | (Followup & { type: 'followup'; event_date: string; service_name?: string })
  | (Appointment & { type: 'appointment'; event_date: string; service_name: string });