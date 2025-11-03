
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FollowUpModal } from './components/FollowUpModal';
import { IntakeModal } from './components/IntakeModal';
import { TodaysAgenda } from './components/TodaysAgenda';
import { ConsultationModal } from './components/ConsultationModal';
import { BillingModal } from './components/BillingModal';
import { useMockApi } from './hooks/useMockApi';
// FIX: Import CalendarBlocker type
import { User, Followup, Patient, HistoryItem, Appointment, Vitals, PrescriptionItem, PatientDocument, Toast, AgendaItem, AppointmentStatus, CalendarBlocker } from './types';
import { InventoryItem } from './types/inventory';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { PatientHistoryModal } from './components/PatientHistoryModal';
import { WaitingRoom } from './components/WaitingRoom';
import { CommunicationModal } from './components/CommunicationModal';
import { BlockTimeModal } from './components/BlockTimeModal';
import { ToastContainer } from './components/Toast';
import { CreateAppointmentModal } from './components/CreateAppointmentModal';
import { CalendarView } from './components/CalendarView';
import { Inventory } from './components/Inventory';
import { InventoryModal } from './components/InventoryModal';


type ViewType = 'dashboard' | 'agenda' | 'calendar' | 'settings' | 'waiting_room' | 'inventory';

export default function App() {
  const api = useMockApi();
  const { users, branches, services, getFollowupsForDate, updateFollowup, updateAppointment, createFollowup, createAppointment, getPatientHistory, searchPatients, createPatient, getAppointmentsForDate, login, getDashboardStats, getNoteTemplates, createNoteTemplate, getCalendarBlockers, createCalendarBlocker, sendMessage, sendAppointmentReminder, getLatestNoteForPatient, runAutomatedReminders } = api;
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

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | undefined>(undefined);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isAgendaLoading, setIsAgendaLoading] = useState(true);

  const fetchAgendaAndBlockers = useCallback(async () => {
    if (!currentUser) return;
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
          const interval = setInterval(fetchAgendaAndBlockers, 30000);
          return () => clearInterval(interval);
      }
  }, [view, currentUser, fetchAgendaAndBlockers]);

  useEffect(() => {
    if (currentUser && view === 'inventory') {
      setIsInventoryLoading(true);
      api.getInventory().then(setInventory).finally(() => setIsInventoryLoading(false));
    }
  }, [view, currentUser, api]);


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
      addToast(`Appointment created successfully!`, 'success');
      if (new Date(data.start_time).toDateString() === new Date().toDateString()) {
          fetchAgendaAndBlockers();
      }
      closeAppointmentModal();
      setIsIntakeModalOpen(false); // Close intake modal if open
    } catch (err) {
      console.error(err);
      addToast('Failed to create appointment.', 'error');
    }
  };

  const handleSaveInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      if (itemToEdit) {
        await api.updateInventoryItem({ ...item, id: itemToEdit.id });
        addToast('Item updated successfully.', 'success');
      } else {
        await api.addInventoryItem(item);
        addToast('Item added successfully.', 'success');
      }
      setInventory(await api.getInventory());
      setIsInventoryModalOpen(false);
      setItemToEdit(undefined);
    } catch (err) {
      addToast('Failed to save item.', 'error');
    }
  };

  const handleDeleteInventoryItem = async (itemId: number) => {
    try {
      await api.deleteInventoryItem(itemId);
      addToast('Item deleted successfully.', 'success');
      setInventory(await api.getInventory());
    } catch (err) {
      addToast('Failed to delete item.', 'error');
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
      fetchAgendaAndBlockers();
    } catch (err)
 {
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
          fetchAgendaAndBlockers();
      } catch (e) {
          addToast('Failed to block time.', 'error');
      }
  };

  const handleSendReminder = async (appointmentId: number) => {
      try {
          await sendAppointmentReminder(appointmentId);
          addToast('Appointment reminder sent.', 'success');
          fetchAgendaAndBlockers();
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
        fetchAgendaAndBlockers();
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
            {view === 'dashboard' && <Dashboard getStatsApi={getDashboardStats} runAutomatedRemindersApi={runAutomatedReminders} addToast={addToast} />}
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
            {view === 'inventory' && (
              <Inventory
                inventory={inventory}
                onAddItem={() => {
                  setItemToEdit(undefined);
                  setIsInventoryModalOpen(true);
                }}
                onEditItem={(item) => {
                  setItemToEdit(item);
                  setIsInventoryModalOpen(true);
                }}
                onDeleteItem={handleDeleteInventoryItem}
                loading={isInventoryLoading}
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
          createAppointmentApi={handleCreateAppointment}
          services={services}
          branches={branches}
          currentUser={currentUser}
          getAppointmentsForDate={getAppointmentsForDate}
          getCalendarBlockers={getCalendarBlockers}
        />
      )}
      {modalState.isOpen && modalState.date && <FollowUpModal date={modalState.date} branchId={selectedBranchId} initialFollowups={followups} loading={loadingFollowups} onClose={closeModal} onUpdate={onFollowupUpdate} updateFollowupApi={updateFollowup} createFollowupApi={createFollowup} currentUser={currentUser} onInitiateAppointment={handleInitiateAppointment} onShowPatientHistory={handleShowPatientHistory} />}
      {appointmentModalState.isOpen && appointmentModalState.patient && <CreateAppointmentModal patient={appointmentModalState.patient} onClose={closeAppointmentModal} services={services} branches={branches} currentUser={currentUser} onCreateAppointment={handleCreateAppointment} getAppointmentsForDate={getAppointmentsForDate} getCalendarBlockers={getCalendarBlockers} />}
      {patientHistoryModalState.isOpen && patientHistoryModalState.patient && <PatientHistoryModal patient={patientHistoryModalState.patient} history={patientHistoryModalState.history} documents={patientHistoryModalState.documents} allAppointments={patientHistoryModalState.history.filter(item => item.type === 'appointment') as Appointment[]} loading={patientHistoryModalState.loading} onClose={closePatientHistoryModal} />}
      {consultationModalState.isOpen && consultationModalState.appointment && <ConsultationModal appointment={consultationModalState.appointment} onClose={() => setConsultationModalState({ isOpen: false, appointment: null })} onComplete={handleCompleteConsultation} onShowPatientHistory={handleShowPatientHistory} getNoteTemplatesApi={getNoteTemplates} currentUser={currentUser} getLatestNoteForPatientApi={getLatestNoteForPatient} />}
      {billingModalState.isOpen && billingModalState.appointment && <BillingModal appointment={billingModalState.appointment} onClose={() => setBillingModalState({ isOpen: false, appointment: null })} getInvoiceApi={api.getInvoiceForAppointment} recordPaymentApi={api.recordPayment} />}
      {communicationModalState.isOpen && communicationModalState.appointment && <CommunicationModal appointment={communicationModalState.appointment} onClose={() => setCommunicationModalState({ isOpen: false, appointment: null })} sendMessageApi={sendMessage} />}
      {isBlockTimeModalOpen && <BlockTimeModal onClose={() => setIsBlockTimeModalOpen(false)} onCreateBlocker={handleCreateBlocker} currentUser={currentUser} />}
      {isInventoryModalOpen && (
        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={() => {
            setIsInventoryModalOpen(false);
            setItemToEdit(undefined);
          }}
          onSave={handleSaveInventoryItem}
          itemToEdit={itemToEdit}
        />
      )}
    </div>
  );
}
