import { useState, useCallback } from 'react';
import { User, Branch, Patient, Followup, Service, Appointment, HistoryItem, Vitals, Invoice, InvoiceStatus, PrescriptionItem } from '../types';

// --- MOCK DATABASE ---

const branches: Branch[] = [
  { id: 1, name: 'West Clinic' },
  { id: 2, name: 'East Clinic' },
];

const users: User[] = [
  { id: 1, name: 'Dr. Prasanna', role: 'doctor' },
  { id: 2, name: 'Anjali (Reception)', role: 'receptionist', branch_id: 1 },
  { id: 3, name: 'Rohan (Reception)', role: 'receptionist', branch_id: 2 },
];

let mockPatients: Patient[] = [
  { id: 45, name: 'Sowmya', phone: '9876543210', dob: '1993-05-12', gender: 'F' },
  { id: 46, name: 'Rajesh Kumar', phone: '8765432109', dob: '1985-11-20', gender: 'M' },
  { id: 47, name: 'Priya Sharma', phone: '7654321098', dob: '2001-02-10', gender: 'F' },
  { id: 48, name: 'Amit Singh', phone: '6543210987', dob: '1978-08-30', gender: 'M' },
];

const services: Service[] = [
    { id: 1, name: 'Consultation', duration_minutes: 30, price: 500 },
    { id: 2, name: 'Routine Check-up', duration_minutes: 20, price: 300 },
    { id: 3, name: 'Extended Consultation', duration_minutes: 60, price: 900 },
];

let mockInvoices: Invoice[] = [
    { 
        id: 1, 
        appointment_id: 4, 
        service_name: 'Routine Check-up', 
        amount: 300, 
        status: 'paid', 
        patient_name: 'Sowmya',
        invoice_date: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0]
    }
];

const enrichAppointments = (appointments: Omit<Appointment, 'patient' | 'service_name'>[]): Appointment[] => {
    return appointments.map(appt => {
        const patient = mockPatients.find(p => p.id === appt.patient_id);
        const service = services.find(s => s.id === appt.service_id);
        if (!patient || !service) throw new Error("Patient or Service not found for appointment");
        return {
            ...appt,
            patient,
            service_name: service.name,
        };
    });
};

let mockAppointmentsData: Omit<Appointment, 'patient' | 'service_name'>[] = [
    { id: 1, branch_id: 1, doctor_id: 1, patient_id: 45, service_id: 1, start_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(), end_time: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(), status: 'confirmed' },
    { id: 2, branch_id: 1, doctor_id: 1, patient_id: 46, service_id: 2, start_time: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(), end_time: new Date(new Date().setHours(11, 20, 0, 0)).toISOString(), status: 'confirmed' },
    { id: 3, branch_id: 2, doctor_id: 1, patient_id: 47, service_id: 1, start_time: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(), end_time: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(), status: 'confirmed' },
    { id: 4, branch_id: 1, doctor_id: 1, patient_id: 45, service_id: 2, start_time: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(), end_time: new Date(new Date(new Date().setDate(new Date().getDate() - 20)).getTime() + 20 * 60000).toISOString(), status: 'completed', notes: 'Patient responded well to the treatment. Recommended a follow-up in a month.', vitals: { bp: '122/81', temp: 36.8, weight: 72 }, invoice_id: 1 }
];

const generateFollowups = (): Followup[] => {
  const today = new Date();
  const followups: Followup[] = [];
  let idCounter = 100;
  followups.push({ id: idCounter++, patient: mockPatients[0], doctor_id: 1, branch_id: 1, scheduled_date: new Date(today.setDate(today.getDate() - 2)).toISOString().split('T')[0], scheduled_time: '10:30:00', status: 'pending', priority: 'high', notes: 'Check sugar levels.', created_by: 2 });
  followups.push({ id: idCounter++, patient: mockPatients[1], doctor_id: 1, branch_id: 1, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '11:00:00', status: 'pending', priority: 'urgent', recurrence: { type: 'daily', interval: 7 }, notes: 'Weekly BP check.', created_by: 2 });
  followups.push({ id: idCounter++, patient: mockPatients[2], doctor_id: 1, branch_id: 2, scheduled_date: new Date().toISOString().split('T')[0], status: 'snoozed', priority: 'normal', notes: 'Follow up on lab reports.', created_by: 3 });
  followups.push({ id: idCounter++, patient: mockPatients[3], doctor_id: 1, branch_id: 2, scheduled_date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0], status: 'pending', priority: 'low', notes: 'Routine check-up call.', created_by: 3 });
  followups.push({ id: idCounter++, patient: mockPatients[0], doctor_id: 1, branch_id: 2, scheduled_date: new Date().toISOString().split('T')[0], status: 'pending', priority: 'normal', notes: 'Discuss recent scan.', created_by: 3 });
  return followups;
};

let mockFollowups: Followup[] = generateFollowups();
let mockAppointments: Appointment[] = enrichAppointments(mockAppointmentsData);

export const useMockApi = () => {
  const [followups, setFollowups] = useState<Followup[]>(mockFollowups);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  const getFollowupsForDate = useCallback(async (date: Date, branchId: number | 'all'): Promise<Followup[]> => {
    const dateStr = date.toISOString().split('T')[0];
    await new Promise(res => setTimeout(res, 500));
    return followups.filter(f => f.scheduled_date === dateStr && (branchId === 'all' || f.branch_id === branchId) && f.status !== 'canceled');
  }, [followups]);

  const getAppointmentsForDate = useCallback(async (date: Date, branchId: number | 'all'): Promise<Appointment[]> => {
    const dateStr = date.toISOString().split('T')[0];
    await new Promise(res => setTimeout(res, 400));
    const filtered = appointments.filter(a => a.start_time.split('T')[0] === dateStr && (branchId === 'all' || a.branch_id === branchId));
    return filtered.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [appointments]);
  
  const getFollowupCounts = useCallback((start: Date, end: Date, branchId: number | 'all'): Record<string, number> => {
      const counts: Record<string, number> = {};
      const relevantFollowups = followups.filter(f => new Date(f.scheduled_date + 'T00:00:00') >= start && new Date(f.scheduled_date + 'T00:00:00') <= end && (branchId === 'all' || f.branch_id === branchId) && f.status === 'pending');
      for (const f of relevantFollowups) { counts[f.scheduled_date] = (counts[f.scheduled_date] || 0) + 1; }
      return counts;
  }, [followups]);

  const updateFollowup = useCallback(async (updateData: Partial<Followup> & { id: number }): Promise<Followup> => {
    await new Promise(res => setTimeout(res, 300));
    let updatedFollowup: Followup | undefined;
    const newFollowups = followups.map(f => f.id === updateData.id ? (updatedFollowup = { ...f, ...updateData }) : f);
    if (!updatedFollowup) throw new Error("Followup not found");
    setFollowups(newFollowups);
    mockFollowups = newFollowups;
    return updatedFollowup;
  }, [followups]);

  const updateAppointment = useCallback(async (updateData: Partial<Appointment> & { id: number }): Promise<Appointment> => {
      await new Promise(res => setTimeout(res, 300));
      let updatedAppointment: Appointment | undefined;
      let newInvoiceCreated = false;

      const newAppointments = appointments.map(a => {
          if (a.id === updateData.id) {
              updatedAppointment = { ...a, ...updateData };
              // --- BILLING LOGIC ---
              // If appointment is completed and has no invoice yet, create one.
              if (updatedAppointment.status === 'completed' && !updatedAppointment.invoice_id) {
                  const service = services.find(s => s.id === updatedAppointment!.service_id);
                  if (service) {
                      const newInvoice: Invoice = {
                          id: Math.max(0, ...invoices.map(i => i.id)) + 1,
                          appointment_id: updatedAppointment.id,
                          service_name: service.name,
                          amount: service.price,
                          status: 'pending',
                          patient_name: updatedAppointment.patient.name,
                          invoice_date: new Date().toISOString().split('T')[0]
                      };
                      mockInvoices = [...invoices, newInvoice];
                      setInvoices(mockInvoices);
                      updatedAppointment.invoice_id = newInvoice.id;
                      newInvoiceCreated = true;
                  }
              }
              return updatedAppointment;
          }
          return a;
      });
      if (!updatedAppointment) throw new Error("Appointment not found");

      setAppointments(newAppointments);
      mockAppointments = newAppointments;
      return updatedAppointment;
  }, [appointments, invoices]);
  
  const createFollowup = useCallback(async (followupData: Omit<Followup, 'id' | 'patient'> & { patient_id: number }): Promise<Followup> => {
      await new Promise(res => setTimeout(res, 300));
      const patient = patients.find(p => p.id === followupData.patient_id);
      if (!patient) throw new Error("Patient not found");
      const newFollowup: Followup = { ...followupData, id: Math.max(...followups.map(f => f.id)) + 1, patient, };
      const newFollowups = [...followups, newFollowup];
      setFollowups(newFollowups);
      mockFollowups = newFollowups;
      return newFollowup;
  }, [followups, patients]);

  const createAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'end_time' | 'patient' | 'service_name'>): Promise<Appointment> => {
    await new Promise(res => setTimeout(res, 400));
    const service = services.find(s => s.id === appointmentData.service_id);
    const patient = patients.find(p => p.id === appointmentData.patient_id);
    if (!service || !patient) throw new Error("Service or Patient not found");
    const startTime = new Date(appointmentData.start_time);
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
    const newAppointment: Appointment = { ...appointmentData, id: Math.max(0, ...appointments.map(a => a.id)) + 1, end_time: endTime.toISOString(), patient, service_name: service.name };
    const newAppointments = [...appointments, newAppointment];
    setAppointments(newAppointments);
    mockAppointments = newAppointments;
    return newAppointment;
  }, [appointments, patients]);
  
  const getPatientHistory = useCallback(async (patientId: number): Promise<HistoryItem[]> => {
    await new Promise(res => setTimeout(res, 500));
    const patientFollowups: HistoryItem[] = followups.filter(f => f.patient.id === patientId).map(f => ({ ...f, type: 'followup', event_date: f.scheduled_date }));
    const patientAppointments: HistoryItem[] = appointments.filter(a => a.patient_id === patientId).map(a => ({ ...a, type: 'appointment', event_date: a.start_time.split('T')[0] }));
    return [...patientFollowups, ...patientAppointments].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }, [followups, appointments]);
  
  const searchPatients = useCallback(async (searchTerm: string): Promise<Patient[]> => {
    await new Promise(res => setTimeout(res, 300));
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(lowerCaseSearchTerm) || p.phone.includes(lowerCaseSearchTerm));
  }, [patients]);

  const createPatient = useCallback(async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
    await new Promise(res => setTimeout(res, 400));
    const newPatient: Patient = { ...patientData, id: Math.max(0, ...patients.map(p => p.id)) + 1 };
    const newPatients = [...patients, newPatient];
    setPatients(newPatients);
    mockPatients = newPatients;
    return newPatient;
  }, [patients]);

  const getInvoiceForAppointment = useCallback(async (appointmentId: number): Promise<Invoice | undefined> => {
      await new Promise(res => setTimeout(res, 200));
      return invoices.find(inv => inv.appointment_id === appointmentId);
  }, [invoices]);

  const recordPayment = useCallback(async (invoiceId: number): Promise<Invoice> => {
      await new Promise(res => setTimeout(res, 400));
      let updatedInvoice: Invoice | undefined;
      const newInvoices = invoices.map(inv => inv.id === invoiceId ? (updatedInvoice = {...inv, status: 'paid'}) : inv);
      if (!updatedInvoice) throw new Error("Invoice not found");
      setInvoices(newInvoices);
      mockInvoices = newInvoices;
      return updatedInvoice;
  }, [invoices]);

  return { users, branches, services, patients, getFollowupsForDate, getAppointmentsForDate, getFollowupCounts, updateFollowup, updateAppointment, createFollowup, createAppointment, getPatientHistory, searchPatients, createPatient, getInvoiceForAppointment, recordPayment };
};