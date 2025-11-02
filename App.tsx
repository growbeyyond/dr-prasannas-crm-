import React, { useState, useMemo, useCallback } from 'react';
import { CalendarView } from './components/CalendarView';
import { Header } from './components/Header';
import { FollowUpModal } from './components/FollowUpModal';
import { IntakeModal } from './components/IntakeModal';
import { TodaysAgenda } from './components/TodaysAgenda';
import { ConsultationModal } from './components/ConsultationModal';
import { BillingModal } from './components/BillingModal';
import { useMockApi } from './hooks/useMockApi';
import { User, Followup, Branch, Patient, Service, HistoryItem, Appointment, Vitals, PrescriptionItem } from './types';
import { SpinnerIcon, ClipboardListIcon, CalendarPlusIcon } from './components/icons';

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

// --- PatientHistoryModal Component ---
interface PatientHistoryModalProps {
  patient: Patient;
  history: HistoryItem[];
  loading: boolean;
  onClose: () => void;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, history, loading, onClose }) => {
    const getAge = (dob: string | undefined): number | 'N/A' => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };
    const age = getAge(patient.dob);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-slate-800">Patient History</h2>
                    <div className="text-slate-600 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span><strong>Patient:</strong> {patient.name} ({age !== 'N/A' ? `${age} years` : 'Age N/A'})</span>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <span><strong>Phone:</strong> {patient.phone}</span>
                    </div>
                </div>
                <div className="p-6 space-y-4 flex-grow overflow-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8" /></div>
                    ) : history.length === 0 ? (
                        <div className="text-center text-slate-500 py-16">No history found for this patient.</div>
                    ) : (
                        <ul className="space-y-4">
                            {history.map(item => (
                                <li key={`${item.type}-${item.id}`} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'appointment' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {item.type === 'appointment' ? <CalendarPlusIcon className="w-5 h-5"/> : <ClipboardListIcon className="w-5 h-5"/>}
                                        </div>
                                        <div className="w-px h-full bg-slate-200"></div>
                                    </div>
                                    <div className="pb-4 flex-grow">
                                        <p className="font-semibold text-slate-700">{item.type === 'appointment' ? `Appointment: ${item.service_name}` : 'Follow-up'}</p>
                                        <p className="text-sm text-slate-500">{new Date(item.event_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        {item.type === 'followup' && <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 rounded-md">Note: {item.notes || 'No notes'}</p>}
                                        <p className="text-xs text-slate-400 mt-1">Status: <span className="font-medium capitalize">{item.status}</span></p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800">Close</button>
                </div>
            </div>
        </div>
    );
};


export default function App() {
  const api = useMockApi();
  const { users, branches, services, getFollowupsForDate, updateFollowup, updateAppointment, createFollowup, createAppointment, getPatientHistory, searchPatients, createPatient, getAppointmentsForDate } = api;
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>(currentUser.role === 'doctor' ? 'all' : currentUser.branch_id!);
  
  const [view, setView] = useState<'agenda' | 'calendar'>('agenda');
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; date: Date | null }>({ isOpen: false, date: null });
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);

  const [appointmentModalState, setAppointmentModalState] = useState<{ isOpen: boolean; patient: Patient | null }>({ isOpen: false, patient: null });

  const [patientHistoryModalState, setPatientHistoryModalState] = useState<{ isOpen: boolean; patient: Patient | null; history: HistoryItem[]; loading: boolean; }>({ isOpen: false, patient: null, history: [], loading: false });

  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  const [consultationModalState, setConsultationModalState] = useState<{isOpen: boolean; appointment: Appointment | null}>({ isOpen: false, appointment: null });

  const [billingModalState, setBillingModalState] = useState<{ isOpen: boolean; appointment: Appointment | null}>({ isOpen: false, appointment: null });

  const handleUserChange = (userId: number) => {
    const newUser = users.find(u => u.id === userId)!;
    setCurrentUser(newUser);
    setSelectedBranchId(newUser.role === 'doctor' ? 'all' : newUser.branch_id!);
  };

  const handleBranchChange = (branchId: number | 'all') => setSelectedBranchId(branchId);

  const onDateClick = useCallback(async (date: Date) => {
    setModalState({ isOpen: true, date });
    setLoadingFollowups(true);
    try {
      setFollowups(await getFollowupsForDate(date, selectedBranchId));
    } catch (err) {
      console.error(err);
      alert('Failed to load followups');
    } finally {
      setLoadingFollowups(false);
    }
  }, [selectedBranchId, getFollowupsForDate]);

  const closeModal = () => setModalState({ isOpen: false, date: null });
  const onFollowupUpdate = useCallback((updatedFollowups: Followup[]) => setFollowups(updatedFollowups), []);
  const handleInitiateAppointment = useCallback((patient: Patient) => setAppointmentModalState({ isOpen: true, patient }), []);
  const closeAppointmentModal = () => setAppointmentModalState({ isOpen: false, patient: null });

  const handleCreateAppointment = async (data: Omit<Appointment, 'id' | 'end_time' | 'patient' | 'service_name'>) => {
    try {
      await createAppointment(data);
      alert(`Appointment created for ${appointmentModalState.patient?.name}!`);
      closeAppointmentModal();
    } catch (err) {
      console.error(err);
      alert('Failed to create appointment.');
    }
  };

  const handleShowPatientHistory = useCallback(async (patient: Patient) => {
    setPatientHistoryModalState({ isOpen: true, patient, history: [], loading: true });
    try {
        setPatientHistoryModalState({ isOpen: true, patient, history: await getPatientHistory(patient.id), loading: false });
    } catch (err) {
        console.error(err);
        alert('Failed to load patient history.');
        setPatientHistoryModalState({ isOpen: false, patient: null, history: [], loading: false });
    }
  }, [getPatientHistory]);

  const closePatientHistoryModal = () => setPatientHistoryModalState({ isOpen: false, patient: null, history: [], loading: false });
  
  const handleStartConsultation = (appointment: Appointment) => setConsultationModalState({ isOpen: true, appointment });

  const handleCompleteConsultation = async (appointmentId: number, data: { vitals: Vitals; notes: string, prescription: PrescriptionItem[] }) => {
    try {
      await updateAppointment({ id: appointmentId, ...data, status: 'completed' });
      setConsultationModalState({ isOpen: false, appointment: null });
      alert('Consultation completed and saved.');
    } catch (err) {
      console.error(err);
      alert('Failed to save consultation.');
    }
  };

  const handleOpenBilling = (appointment: Appointment) => setBillingModalState({ isOpen: true, appointment });

  const activeBranches = useMemo(() => currentUser.role === 'doctor' ? branches : branches.filter(b => b.id === currentUser.branch_id), [currentUser, branches]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header
        currentUser={currentUser}
        users={users}
        onUserChange={handleUserChange}
        branches={activeBranches}
        selectedBranchId={selectedBranchId}
        onBranchChange={handleBranchChange}
        isDoctor={currentUser.role === 'doctor'}
        onNewPatientClick={() => setIsIntakeModalOpen(true)}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setView('agenda')} className={`px-4 py-2 rounded-md font-semibold ${view === 'agenda' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-200'}`}>Today's Agenda</button>
                <button onClick={() => setView('calendar')} className={`px-4 py-2 rounded-md font-semibold ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-200'}`}>Follow-up Calendar</button>
            </div>
            {view === 'agenda' ? (
                <TodaysAgenda 
                    getAppointmentsApi={getAppointmentsForDate}
                    updateAppointmentApi={updateAppointment}
                    selectedBranchId={selectedBranchId}
                    currentUser={currentUser}
                    onStartConsultation={handleStartConsultation}
                    onOpenBilling={handleOpenBilling}
                />
            ) : <CalendarView onDateClick={onDateClick} selectedBranchId={selectedBranchId} />}
        </div>
      </main>

      {/* FIX: Pass required props to IntakeModal explicitly to fix type error. */}
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
      {patientHistoryModalState.isOpen && patientHistoryModalState.patient && <PatientHistoryModal patient={patientHistoryModalState.patient} history={patientHistoryModalState.history} loading={patientHistoryModalState.loading} onClose={closePatientHistoryModal} />}
      {consultationModalState.isOpen && consultationModalState.appointment && <ConsultationModal appointment={consultationModalState.appointment} onClose={() => setConsultationModalState({ isOpen: false, appointment: null })} onComplete={handleCompleteConsultation} onShowPatientHistory={handleShowPatientHistory} />}
      {billingModalState.isOpen && billingModalState.appointment && <BillingModal appointment={billingModalState.appointment} onClose={() => setBillingModalState({ isOpen: false, appointment: null })} getInvoiceApi={api.getInvoiceForAppointment} recordPaymentApi={api.recordPayment} />}
    </div>
  );
}
