
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CalendarView } from './components/CalendarView';
import { Header } from './components/Header';
import { FollowUpModal } from './components/FollowUpModal';
import { IntakeModal } from './components/IntakeModal';
import { TodaysAgenda } from './components/TodaysAgenda';
import { ConsultationModal } from './components/ConsultationModal';
import { BillingModal } from './components/BillingModal';
import { useMockApi } from './hooks/useMockApi';
import { User, Followup, Branch, Patient, Service, HistoryItem, Appointment, Vitals, PrescriptionItem, PatientDocument, ClinicalNoteTemplate, CalendarBlocker, Toast, AgendaItem, AppointmentStatus } from './types';
import { SpinnerIcon } from './components/icons';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { PatientHistoryModal } from './components/PatientHistoryModal';
import { WaitingRoom } from './components/WaitingRoom';
import { CommunicationModal } from './components/CommunicationModal';
import { BlockTimeModal } from './components/BlockTimeModal';
import { ToastContainer } from './components/Toast';


// --- CreateAppointmentModal Component ---
interface CreateAppointmentModalProps {
  patient: Patient;
  services: Service[];
  branches: Branch[];
  currentUser: User;
  onClose: () => void;
  onCreateAppointment: (data: { 
    patient_id: number; 
    service_id: number; 
    start_time: string; 
    branch_id: number; 
    doctor_id: number;
    status: 'confirmed';
  }) => Promise<void>;
}

const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  patient,
  services,
  branches,
  currentUser,
  onClose,
  onCreateAppointment,
}) => {
  const [serviceId, setServiceId] = useState<string>(services[0]?.id.toString() || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('09:00');
  const [branchId, setBranchId] = useState<string>(
    (currentUser.branch_id || branches[0]?.id).toString()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !date || !time || !branchId) {
      alert('Please fill all fields.');
      return;
    }
    setIsSubmitting(true);
    const start_time = new Date(`${date}T${time}:00`).toISOString();
    
    await onCreateAppointment({
      patient_id: patient.id,
      service_id: Number(serviceId),
      start_time,
      branch_id: Number(branchId),
      doctor_id: 1, // Assuming Dr. Prasanna is always doctor_id 1
      status: 'confirmed',
    });
    setIsSubmitting(false);
  };

  const availableTimeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-slate-800">New Appointment</h2>
            <p className="text-slate-600 mt-1">For: <span className="font-semibold">{patient.name}</span></p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-slate-700 mb-1">Service</label>
              <select
                id="service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
              </select>
            </div>
            
            {currentUser.role === 'doctor' && (
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                <select
                  id="branch"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                  required
                >
                  {availableTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
              {isSubmitting && <SpinnerIcon className="w-4 h-4" />}
              Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

type ViewType = 'dashboard' | 'agenda' | 'calendar' | 'settings' | 'waiting_room';

export default function App() {
  const api = useMockApi();
  const { users, branches, services, getFollowupsForDate, updateFollowup, updateAppointment, createFollowup, createAppointment, getPatientHistory, searchPatients, createPatient, getAppointmentsForDate, login, getDashboardStats, updateService, getNoteTemplates, createNoteTemplate, getCalendarBlockers, createCalendarBlocker, sendMessage, sendAppointmentReminder } = api;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>('all');
  
  const [view, setView] = useState<ViewType>('dashboard');
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; date: Date | null }>({ isOpen: false, date: null });
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);

  const [appointmentModalState, setAppointmentModalState] = useState<{ isOpen: boolean; patient: Patient | null }>({ isOpen: false, patient: null });

  const [patientHistoryModalState, setPatientHistoryModalState] = useState<{ isOpen: boolean; patient: Patient | null; history: HistoryItem[]; documents: PatientDocument[]; loading: boolean; }>({ isOpen: false, patient: null, history: [], documents: [], loading: false });

  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  const [consultationModalState, setConsultationModalState] = useState<{isOpen: boolean; appointment: Appointment | null}>({ isOpen: false, appointment: null });

  const [billingModalState, setBillingModalState] = useState<{ isOpen: boolean; appointment: Appointment | null}>({ isOpen: false, appointment: null });
  
  const [communicationModalState, setCommunicationModalState] = useState<{isOpen: boolean; appointment: Appointment | null}>({ isOpen: false, appointment: null });

  const [isBlockTimeModalOpen, setIsBlockTimeModalOpen] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  // FIX: Moved addToast and removeToast before their usage in fetchAgendaAndBlockers to fix a "used before declaration" error.
  // Also wrapped removeToast in useCallback and added it as a dependency to addToast to fix a stale closure bug.
  const removeToast = useCallback((id: number) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  // --- Agenda and Waiting Room State ---
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isAgendaLoading, setIsAgendaLoading] = useState(true);

  const fetchAgendaAndBlockers = useCallback(async () => {
    if (!currentUser) return;
    
    // Don't show main loader on background refresh
    // setIsAgendaLoading(true); 
    
    try {
        const today = new Date();
        const appointmentsData = await getAppointmentsForDate(today, selectedBranchId);
        const blockersData = ['doctor', 'admin'].includes(currentUser.role)
            ? await getCalendarBlockers(today, currentUser.id)
            : [];
        
        const items: AgendaItem[] = [
            ...appointmentsData.map((a): AgendaItem => ({ ...a, itemType: 'appointment' })),
            ...blockersData.map((b): AgendaItem => ({ ...b, itemType: 'blocker' })),
        ];
        
        items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        setAgendaItems(items);
    } catch (err) {
        console.error(err);
        addToast("Failed to refresh agenda.", "error");
    } finally {
        setIsAgendaLoading(false);
    }
  }, [currentUser, selectedBranchId, getAppointmentsForDate, getCalendarBlockers, addToast]);

  useEffect(() => {
      if (currentUser && (view === 'agenda' || view === 'waiting_room')) {
          setIsAgendaLoading(true);
          fetchAgendaAndBlockers();
          const interval = setInterval(fetchAgendaAndBlockers, 30000); // Poll every 30s
          return () => clearInterval(interval);
      }
  }, [view, currentUser, fetchAgendaAndBlockers]);


  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setSelectedBranchId(user.role === 'receptionist' ? user.branch_id! : 'all');
    setView('dashboard');
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
  }

  const handleBranchChange = (branchId: number | 'all') => setSelectedBranchId(branchId);

  const onDateClick = useCallback(async (date: Date) => {
    setModalState({ isOpen: true, date });
    setLoadingFollowups(true);
    try {
      setFollowups(await getFollowupsForDate(date, selectedBranchId));
    } catch (err) {
      console.error(err);
      addToast('Failed to load follow-ups.', 'error');
    } finally {
      setLoadingFollowups(false);
    }
  }, [selectedBranchId, getFollowupsForDate, addToast]);

  const closeModal = () => setModalState({ isOpen: false, date: null });
  const onFollowupUpdate = useCallback((updatedFollowups: Followup[]) => setFollowups(updatedFollowups), []);
  const handleInitiateAppointment = useCallback((patient: Patient) => setAppointmentModalState({ isOpen: true, patient }), []);
  const closeAppointmentModal = () => setAppointmentModalState({ isOpen: false, patient: null });

  const handleCreateAppointment = async (data: Omit<Appointment, 'id' | 'end_time' | 'patient' | 'service_name' | 'reminder_sent'>) => {
    try {
      await createAppointment(data);
      addToast(`Appointment created for ${appointmentModalState.patient?.name}!`, 'success');
      if (new Date(data.start_time).toDateString() === new Date().toDateString()) {
          fetchAgendaAndBlockers(); // Refresh agenda if appointment is for today
      }
      closeAppointmentModal();
    } catch (err) {
      console.error(err);
      addToast('Failed to create appointment.', 'error');
    }
  };

  const handleShowPatientHistory = useCallback(async (patient: Patient) => {
    setPatientHistoryModalState({ isOpen: true, patient, history: [], documents: [], loading: true });
    try {
        const { history, documents } = await getPatientHistory(patient.id);
        setPatientHistoryModalState({ isOpen: true, patient, history, documents, loading: false });
    } catch (err) {
        console.error(err);
        addToast('Failed to load patient history.', 'error');
        setPatientHistoryModalState({ isOpen: false, patient: null, history: [], documents: [], loading: false });
    }
  }, [getPatientHistory, addToast]);

  const closePatientHistoryModal = () => setPatientHistoryModalState({ isOpen: false, patient: null, history: [], documents: [], loading: false });
  
  const handleStartConsultation = (appointment: Appointment) => setConsultationModalState({ isOpen: true, appointment });

  const handleCompleteConsultation = async (appointmentId: number, data: { vitals: Vitals; notes: string, prescription: PrescriptionItem[] }) => {
    try {
      await updateAppointment({ id: appointmentId, ...data, status: 'completed' });
      setConsultationModalState({ isOpen: false, appointment: null });
      addToast('Consultation completed and saved.', 'success');
      fetchAgendaAndBlockers(); // Refresh agenda
    } catch (err) {
      console.error(err);
      addToast('Failed to save consultation.', 'error');
    }
  };

  const handleOpenBilling = (appointment: Appointment) => setBillingModalState({ isOpen: true, appointment });
  
  const handleCreateBlocker = async (blockerData: Omit<CalendarBlocker, 'id'>) => {
      try {
          await createCalendarBlocker(blockerData);
          setIsBlockTimeModalOpen(false);
          addToast('Time has been blocked successfully.', 'success');
          fetchAgendaAndBlockers(); // Refresh agenda
      } catch (e) {
          addToast('Failed to block time.', 'error');
      }
  };

  const handleSendReminder = async (appointmentId: number) => {
      try {
          await sendAppointmentReminder(appointmentId);
          addToast('Appointment reminder sent.', 'success');
          fetchAgendaAndBlockers(); // Refresh agenda to update reminder status
      } catch (e) {
          addToast('Failed to send reminder.', 'error');
      }
  };
  
  const handleAgendaAppointmentUpdate = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    try {
        await updateAppointment({ id: appointment.id, status: newStatus });
        if (newStatus === 'checked_in') {
            addToast(`Patient ${appointment.patient.name} checked in. Dr. Prasanna has been notified.`, 'info');
        }
        fetchAgendaAndBlockers(); // Always refetch to get latest state
    } catch (err) {
        addToast('Failed to update status', 'error');
    }
  };

  const activeBranches = useMemo(() => currentUser?.role === 'doctor' ? branches : branches.filter(b => b.id === currentUser?.branch_id), [currentUser, branches]);

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} loginApi={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        branches={activeBranches}
        selectedBranchId={selectedBranchId}
        onBranchChange={handleBranchChange}
        onNewPatientClick={() => setIsIntakeModalOpen(true)}
        onBlockTimeClick={() => setIsBlockTimeModalOpen(true)}
        currentView={view}
        setView={setView}
        searchPatientsApi={searchPatients}
        onShowPatientHistory={handleShowPatientHistory}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
            {view === 'dashboard' && <Dashboard getStatsApi={getDashboardStats} />}
            {view === 'agenda' && (
                <TodaysAgenda 
                    agendaItems={agendaItems}
                    loading={isAgendaLoading}
                    onAppointmentUpdate={handleAgendaAppointmentUpdate}
                    currentUser={currentUser}
                    onStartConsultation={handleStartConsultation}
                    onOpenBilling={handleOpenBilling}
                    onOpenCommunication={(appt) => setCommunicationModalState({ isOpen: true, appointment: appt })}
                    onSendReminder={handleSendReminder}
                />
            )}
            {view === 'calendar' && <CalendarView onDateClick={onDateClick} selectedBranchId={selectedBranchId} />}
            {view === 'settings' && <Settings api={api} currentUser={currentUser} />}
            {view === 'waiting_room' && (
                <WaitingRoom
                    loading={isAgendaLoading}
                    waitingPatients={agendaItems.filter(item => item.itemType === 'appointment' && item.status === 'checked_in') as Appointment[]}
                />
            )}
        </div>
      </main>

      {isIntakeModalOpen && (
        <IntakeModal
          onClose={() => setIsIntakeModalOpen(false)}
          searchPatientsApi={searchPatients}
          createPatientApi={createPatient}
          createFollowupApi={createFollowup}
          createAppointmentApi={createAppointment}
          services={services}
          branches={branches}
          currentUser={currentUser}
        />
      )}
      {modalState.isOpen && modalState.date && <FollowUpModal date={modalState.date} branchId={selectedBranchId} initialFollowups={followups} loading={loadingFollowups} onClose={closeModal} onUpdate={onFollowupUpdate} updateFollowupApi={updateFollowup} createFollowupApi={createFollowup} currentUser={currentUser} onInitiateAppointment={handleInitiateAppointment} onShowPatientHistory={handleShowPatientHistory} />}
      {appointmentModalState.isOpen && appointmentModalState.patient && <CreateAppointmentModal patient={appointmentModalState.patient} onClose={closeAppointmentModal} services={services} branches={branches} currentUser={currentUser} onCreateAppointment={handleCreateAppointment} />}
      {patientHistoryModalState.isOpen && patientHistoryModalState.patient && <PatientHistoryModal patient={patientHistoryModalState.patient} history={patientHistoryModalState.history} documents={patientHistoryModalState.documents} allAppointments={patientHistoryModalState.history.filter(item => item.type === 'appointment') as Appointment[]} loading={patientHistoryModalState.loading} onClose={closePatientHistoryModal} />}
      {consultationModalState.isOpen && consultationModalState.appointment && <ConsultationModal appointment={consultationModalState.appointment} onClose={() => setConsultationModalState({ isOpen: false, appointment: null })} onComplete={handleCompleteConsultation} onShowPatientHistory={handleShowPatientHistory} getNoteTemplatesApi={getNoteTemplates} currentUser={currentUser} />}
      {billingModalState.isOpen && billingModalState.appointment && <BillingModal appointment={billingModalState.appointment} onClose={() => setBillingModalState({ isOpen: false, appointment: null })} getInvoiceApi={api.getInvoiceForAppointment} recordPaymentApi={api.recordPayment} />}
      {communicationModalState.isOpen && communicationModalState.appointment && <CommunicationModal appointment={communicationModalState.appointment} onClose={() => setCommunicationModalState({ isOpen: false, appointment: null })} sendMessageApi={sendMessage} />}
      {isBlockTimeModalOpen && <BlockTimeModal onClose={() => setIsBlockTimeModalOpen(false)} onCreateBlocker={handleCreateBlocker} currentUser={currentUser} />}
    </div>
  );
}
