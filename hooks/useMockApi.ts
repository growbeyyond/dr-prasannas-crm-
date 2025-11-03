import { useState, useCallback } from 'react';
import { User, Branch, Patient, Followup, Service, Appointment, HistoryItem, Vitals, Invoice, PrescriptionItem, DashboardStats, ClinicalNoteTemplate, PatientDocument, CalendarBlocker } from '../types';

// --- MOCK DATABASE ---

let branches: Branch[] = [
  { id: 1, name: 'West Clinic' },
  { id: 2, name: 'East Clinic' },
];

let users: User[] = [
  { id: 1, name: 'Dr. Prasanna', email: 'doctor@crm.com', passwordHash: 'password', role: 'doctor', is_active: true },
  { id: 2, name: 'Anjali (Reception)', email: 'anjali@crm.com', passwordHash: 'password', role: 'receptionist', branch_id: 1, is_active: true },
  { id: 3, name: 'Rohan (Reception)', email: 'rohan@crm.com', passwordHash: 'password', role: 'receptionist', branch_id: 2, is_active: true },
  { id: 4, name: 'Admin User', email: 'admin@crm.com', passwordHash: 'password', role: 'admin', is_active: true },
];

let mockDocuments: PatientDocument[] = [
    { id: 1, patient_id: 45, name: 'Blood Report - May 2024.pdf', url: '#', uploaded_at: '2024-05-15T10:00:00Z' },
    { id: 2, patient_id: 45, name: 'X-Ray Scan - Jan 2024.jpg', url: '#', uploaded_at: '2024-01-20T14:30:00Z' },
];

let mockPatients: Patient[] = [
  { id: 45, name: 'Sowmya', phone: '9876543210', dob: '1993-05-12', gender: 'F', documents: mockDocuments.filter(d => d.patient_id === 45) },
  { id: 46, name: 'Rajesh Kumar', phone: '8765432109', dob: '1985-11-20', gender: 'M' },
  { id: 47, name: 'Priya Sharma', phone: '7654321098', dob: '2001-02-10', gender: 'F' },
  { id: 48, name: 'Amit Singh', phone: '6543210987', dob: '1978-08-30', gender: 'M' },
];

let services: Service[] = [
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
    },
    { 
        id: 2, 
        appointment_id: 1, 
        service_name: 'Consultation', 
        amount: 500, 
        status: 'paid', 
        patient_name: 'Sowmya',
        invoice_date: new Date().toISOString().split('T')[0]
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
    { id: 1, branch_id: 1, doctor_id: 1, patient_id: 45, service_id: 1, start_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(), end_time: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(), status: 'completed', invoice_id: 2, reminder_sent: true, notes: "Patient reported feeling better. Blood pressure is stable. Continue medication as prescribed. Re-evaluate in 30 days.", vitals: { bp: '120/80', temp: 37.0, weight: 70 }},
    { id: 2, branch_id: 1, doctor_id: 1, patient_id: 46, service_id: 2, start_time: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(), end_time: new Date(new Date().setHours(11, 20, 0, 0)).toISOString(), status: 'confirmed', reminder_sent: false },
    { id: 3, branch_id: 2, doctor_id: 1, patient_id: 47, service_id: 1, start_time: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(), end_time: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(), status: 'confirmed', reminder_sent: false },
    { id: 4, branch_id: 1, doctor_id: 1, patient_id: 45, service_id: 2, start_time: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(), end_time: new Date(new Date(new Date().setDate(new Date().getDate() - 20)).getTime() + 20 * 60000).toISOString(), status: 'completed', notes: 'Patient responded well to the treatment. Recommended a follow-up in a month.', vitals: { bp: '122/81', temp: 36.8, weight: 72 }, invoice_id: 1, reminder_sent: true }
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

let mockNoteTemplates: ClinicalNoteTemplate[] = [
    { id: 1, name: 'Viral Fever', content: 'Patient presented with fever, cough, and body ache. Advised rest and paracetamol.', doctor_id: 1 },
    { id: 2, name: 'Routine Diabetes Check-up', content: 'Fasting blood sugar reviewed. Diet and medication adherence discussed. Continue current treatment.', doctor_id: 1 },
];

let mockBlockers: CalendarBlocker[] = [
    { id: 1, start_time: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(), end_time: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(), reason: 'Lunch Break', doctor_id: 1 },
];

let mockFollowups: Followup[] = generateFollowups();
let mockAppointments: Appointment[] = enrichAppointments(mockAppointmentsData);

export const useMockApi = () => {
  const [followups, setFollowups] = useState<Followup[]>(mockFollowups);
  const [appointmentState, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [allUsers, setAllUsers] = useState<User[]>(users);
  const [allServices, setAllServices] = useState<Service[]>(services);
  const [noteTemplates, setNoteTemplates] = useState<ClinicalNoteTemplate[]>(mockNoteTemplates);
  const [blockers, setBlockers] = useState<CalendarBlocker[]>(mockBlockers);

  const login = useCallback(async (email: string, pass: string): Promise<User> => {
    await new Promise(res => setTimeout(res, 500));
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.passwordHash === pass && user.is_active) {
        return user;
    }
    throw new Error("Invalid credentials or inactive user.");
  }, [allUsers]);

  const getFollowupsForDate = useCallback(async (date: Date, branchId: number | 'all'): Promise<Followup[]> => {
    const dateStr = date.toISOString().split('T')[0];
    await new Promise(res => setTimeout(res, 500));
    return followups.filter(f => f.scheduled_date === dateStr && (branchId === 'all' || f.branch_id === branchId) && f.status !== 'canceled');
  }, [followups]);

  const getAppointmentsForDate = useCallback(async (date: Date, branchId: number | 'all'): Promise<Appointment[]> => {
    const dateStr = date.toISOString().split('T')[0];
    await new Promise(res => setTimeout(res, 400));
    const filtered = appointmentState.filter(a => a.start_time.split('T')[0] === dateStr && (branchId === 'all' || a.branch_id === branchId));
    return filtered.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [appointmentState]);
  
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
      let newAppointments = [...appointmentState];

      const appointmentIndex = newAppointments.findIndex(a => a.id === updateData.id);
      if (appointmentIndex === -1) throw new Error("Appointment not found");
      
      const originalAppointment = newAppointments[appointmentIndex];
      updatedAppointment = { ...originalAppointment, ...updateData };

      if (updateData.status === 'checked_in' && !originalAppointment.checked_in_time) {
          updatedAppointment.checked_in_time = new Date().toISOString();
      }
      
      if (updatedAppointment.status === 'completed' && !updatedAppointment.invoice_id) {
          const service = allServices.find(s => s.id === updatedAppointment!.service_id);
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
              const newInvoices = [...invoices, newInvoice];
              setInvoices(newInvoices);
              mockInvoices = newInvoices;
              updatedAppointment.invoice_id = newInvoice.id;
          }
      }
      
      newAppointments[appointmentIndex] = updatedAppointment;
      setAppointments(newAppointments);
      mockAppointments = newAppointments;
      return updatedAppointment;
  }, [appointmentState, invoices, allServices, inventory]);
  
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

  const createAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'end_time' | 'patient' | 'service_name' | 'reminder_sent'>): Promise<Appointment> => {
    await new Promise(res => setTimeout(res, 400));
    const service = allServices.find(s => s.id === appointmentData.service_id);
    const patient = patients.find(p => p.id === appointmentData.patient_id);
    if (!service || !patient) throw new Error("Service or Patient not found");
    const startTime = new Date(appointmentData.start_time);
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
    const newAppointment: Appointment = { ...appointmentData, id: Math.max(0, ...appointmentState.map(a => a.id)) + 1, end_time: endTime.toISOString(), patient, service_name: service.name, reminder_sent: false };
    const newAppointments = [...appointmentState, newAppointment];
    setAppointments(newAppointments);
    mockAppointments = newAppointments;
    return newAppointment;
  }, [appointmentState, patients, allServices]);
  
  const getPatientHistory = useCallback(async (patientId: number): Promise<{ history: HistoryItem[], documents: PatientDocument[] }> => {
    await new Promise(res => setTimeout(res, 500));
    const patientFollowups: HistoryItem[] = followups.filter(f => f.patient.id === patientId).map(f => ({ ...f, type: 'followup', event_date: f.scheduled_date }));
    const patientAppointments: HistoryItem[] = appointmentState.filter(a => a.patient_id === patientId).map(a => ({ ...a, type: 'appointment', event_date: a.start_time.split('T')[0] }));
    const history = [...patientFollowups, ...patientAppointments].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    const documents = mockDocuments.filter(d => d.patient_id === patientId);
    return { history, documents };
  }, [followups, appointmentState]);
  
  const searchPatients = useCallback(async (searchTerm: string): Promise<Patient[]> => {
    await new Promise(res => setTimeout(res, 300));
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(lowerCaseSearchTerm) || p.phone.includes(lowerCaseSearchTerm));
  }, [patients]);

  const createPatient = useCallback(async (patientData: Omit<Patient, 'id'> & { photoFile?: File | null, signatureData?: string | null }): Promise<Patient> => {
    await new Promise(res => setTimeout(res, 400));
    const newPatient: Patient = { ...patientData, id: Math.max(0, ...patients.map(p => p.id)) + 1 };

    if (patientData.photoFile) {
        // Simulate upload and get URL
        const photoUrl = URL.createObjectURL(patientData.photoFile);
        newPatient.photo_url = photoUrl;
        newPatient.photo_thumbnail_url = photoUrl;
    }

    if (patientData.signatureData) {
        newPatient.consent_signed = true;
        newPatient.consent_document_url = patientData.signatureData;
    }

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

  const getDashboardStats = useCallback(async (): Promise<DashboardStats> => {
    await new Promise(res => setTimeout(res, 600));
    const todayStr = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter(i => i.invoice_date === todayStr && i.status === 'paid');
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const todayAppointments = appointmentState.filter(a => a.start_time.startsWith(todayStr)).length;
    const pendingFollowups = followups.filter(f => f.scheduled_date === todayStr && f.status === 'pending').length;
    const branchPerformance = branches.map(branch => {
        const branchApptIds = appointmentState.filter(a => a.branch_id === branch.id && a.start_time.startsWith(todayStr)).map(a => a.id);
        const branchRevenue = invoices.filter(i => branchApptIds.includes(i.appointment_id) && i.status === 'paid' && i.invoice_date === todayStr).reduce((sum, inv) => sum + inv.amount, 0);
        return { branchName: branch.name, revenue: branchRevenue, appointments: branchApptIds.length };
    });
    return { todayRevenue, todayAppointments, pendingFollowups, branchPerformance };
  }, [invoices, appointmentState, followups]);
  
  const updateService = useCallback(async (service: Service): Promise<Service> => {
      await new Promise(res => setTimeout(res, 200));
      const newServices = allServices.map(s => s.id === service.id ? service : s);
      setAllServices(newServices);
      services = newServices;
      return service;
  }, [allServices]);

  const getNoteTemplates = useCallback(async (doctorId: number): Promise<ClinicalNoteTemplate[]> => {
    await new Promise(res => setTimeout(res, 200));
    return noteTemplates.filter(t => t.doctor_id === doctorId);
  }, [noteTemplates]);

  const createNoteTemplate = useCallback(async (template: Omit<ClinicalNoteTemplate, 'id'>): Promise<ClinicalNoteTemplate> => {
      await new Promise(res => setTimeout(res, 300));
      const newTemplate = { ...template, id: Math.max(0, ...noteTemplates.map(t => t.id)) + 1 };
      const newTemplates = [...noteTemplates, newTemplate];
      setNoteTemplates(newTemplates);
      mockNoteTemplates = newTemplates;
      return newTemplate;
  }, [noteTemplates]);

  const getCalendarBlockers = useCallback(async (date: Date, doctorId: number): Promise<CalendarBlocker[]> => {
      const dateStr = date.toISOString().split('T')[0];
      await new Promise(res => setTimeout(res, 100));
      return blockers.filter(b => b.doctor_id === doctorId && b.start_time.startsWith(dateStr));
  }, [blockers]);
  
  const createCalendarBlocker = useCallback(async (blockerData: Omit<CalendarBlocker, 'id'>): Promise<CalendarBlocker> => {
      await new Promise(res => setTimeout(res, 300));
      const newBlocker = { ...blockerData, id: Math.max(0, ...blockers.map(b => b.id)) + 1 };
      const newBlockers = [...blockers, newBlocker];
      setBlockers(newBlockers);
      mockBlockers = newBlockers;
      return newBlocker;
  }, [blockers]);
  
  const sendMessage = useCallback(async (patientId: number, message: string): Promise<boolean> => {
      console.log(`Sending message to patient ${patientId}: "${message}"`);
      await new Promise(res => setTimeout(res, 500));
      return true;
  }, []);

  const sendAppointmentReminder = useCallback(async (appointmentId: number): Promise<Appointment> => {
      await new Promise(res => setTimeout(res, 500));
      const appointmentIndex = appointmentState.findIndex(a => a.id === appointmentId);
      if (appointmentIndex === -1) throw new Error("Appointment not found");
      const updatedAppointment = { ...appointmentState[appointmentIndex], reminder_sent: true };
      const newAppointments = [...appointmentState];
      newAppointments[appointmentIndex] = updatedAppointment;
      setAppointments(newAppointments);
      mockAppointments = newAppointments;
      return updatedAppointment;
  }, [appointmentState]);

  const getAllPatients = useCallback(async (): Promise<Patient[]> => {
      await new Promise(res => setTimeout(res, 300));
      return patients;
  }, [patients]);
  
  const getInvoicesForDateRange = useCallback(async (startDate: string, endDate: string): Promise<Invoice[]> => {
      await new Promise(res => setTimeout(res, 500));
      return invoices.filter(i => {
          const invDate = new Date(i.invoice_date);
          return i.status === 'paid' && invDate >= new Date(startDate) && invDate <= new Date(endDate);
      });
  }, [invoices]);
  
  const getAllInvoices = useCallback(async (): Promise<Invoice[]> => {
      await new Promise(res => setTimeout(res, 300));
      return invoices;
  }, [invoices]);

  const getLatestNoteForPatient = useCallback(async (patientId: number): Promise<string | null> => {
      await new Promise(res => setTimeout(res, 400));
      const patientAppointments = appointmentState
          .filter(a => a.patient_id === patientId && a.status === 'completed' && a.notes)
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      return patientAppointments[0]?.notes || null;
  }, [appointmentState]);
  
  const runAutomatedReminders = useCallback(async (): Promise<number> => {
      await new Promise(res => setTimeout(res, 1000));
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      let remindersSent = 0;
      const newAppointments = appointmentState.map(a => {
          if (a.start_time.startsWith(tomorrowStr) && !a.reminder_sent) {
              console.log(`Sending reminder for appointment ${a.id} to ${a.patient.name}`);
              remindersSent++;
              return { ...a, reminder_sent: true };
          }
          return a;
      });
      setAppointments(newAppointments);
      mockAppointments = newAppointments;
      return remindersSent;
  }, [appointmentState]);

  return { users: allUsers, branches, services: allServices, patients, getFollowupsForDate, getAppointmentsForDate, getFollowupCounts, updateFollowup, updateAppointment, createFollowup, createAppointment, getPatientHistory, searchPatients, createPatient, getInvoiceForAppointment, recordPayment, login, getDashboardStats, updateService, getNoteTemplates, createNoteTemplate, getCalendarBlockers, createCalendarBlocker, sendMessage, sendAppointmentReminder, getAllPatients, getAllInvoices, getInvoicesForDateRange, getLatestNoteForPatient, runAutomatedReminders };
};