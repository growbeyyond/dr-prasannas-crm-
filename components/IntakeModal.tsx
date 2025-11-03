import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Patient, Service, Branch, User, Followup, Priority, Appointment, CalendarBlocker } from '../types';
import { SpinnerIcon, SparklesIcon } from './icons';

interface IntakeModalProps {
  onClose: () => void;
  searchPatientsApi: (term: string) => Promise<Patient[]>;
  createPatientApi: (data: Omit<Patient, 'id'> & { photoFile?: File | null, signatureData?: string | null }) => Promise<Patient>;
  createFollowupApi: (data: Omit<Followup, 'id' | 'patient'> & { patient_id: number }) => Promise<Followup>;
  createAppointmentApi: (data: Omit<Appointment, 'id' | 'end_time' | 'patient' | 'service_name' | 'reminder_sent'>) => Promise<void>;
  services: Service[];
  branches: Branch[];
  currentUser: User;
  getAppointmentsForDate: (date: Date, branchId: number | 'all') => Promise<Appointment[]>;
  getCalendarBlockers: (date: Date, doctorId: number) => Promise<CalendarBlocker[]>;
}

type Step = 'search' | 'new_patient' | 'select_action' | 'followup_form' | 'appointment_form';

export const IntakeModal: React.FC<IntakeModalProps> = ({
  onClose,
  searchPatientsApi,
  createPatientApi,
  createFollowupApi,
  createAppointmentApi,
  services,
  branches,
  currentUser,
  getAppointmentsForDate,
  getCalendarBlockers
}) => {
  const [step, setStep] = useState<Step>('search');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
        setSearchResults([]);
        return;
    }
    setIsLoading(true);
    const results = await searchPatientsApi(term);
    setSearchResults(results);
    setIsLoading(false);
  }, [searchPatientsApi]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep('select_action');
  };

  const handleCreateNewPatient = async (patientData: Omit<Patient, 'id'>) => {
      setIsLoading(true);
      try {
        const newPatient = await createPatientApi(patientData);
        handleSelectPatient(newPatient);
      } catch (e) {
        alert('Failed to create patient.');
      } finally {
        setIsLoading(false);
      }
  };

  const handleCreateFollowup = async (data: any) => {
      if (!selectedPatient) return;
      setIsLoading(true);
      try {
        await createFollowupApi({
            patient_id: selectedPatient.id,
            doctor_id: 1, // Dr. Prasanna
            branch_id: data.branch_id,
            scheduled_date: data.scheduled_date,
            notes: data.notes,
            priority: data.priority,
            status: 'pending',
            created_by: currentUser.id,
        });
        onClose();
      } catch(e) {
          alert('Failed to create follow-up.');
      } finally {
        setIsLoading(false);
      }
  };

  const resetAndClose = () => {
    setSelectedPatient(null);
    setStep('search');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={resetAndClose}>
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">New Patient Task</h2>
            <button onClick={resetAndClose} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
        </div>
        
        <div className="p-6 flex-grow overflow-auto">
            {step === 'search' && ( <SearchStep searchTerm={searchTerm} onSearchChange={handleSearch} results={searchResults} onSelectPatient={handleSelectPatient} onAddNew={() => setStep('new_patient')} isLoading={isLoading}/> )}
            {step === 'new_patient' && ( <NewPatientStep onSubmit={handleCreateNewPatient} onBack={() => setStep('search')} isLoading={isLoading}/> )}
            {selectedPatient && step === 'select_action' && ( <SelectActionStep patient={selectedPatient} onSelectAction={(action) => setStep(action)} onBack={() => { setSelectedPatient(null); setStep('search'); }}/> )}
            {selectedPatient && step === 'followup_form' && ( <FollowupFormStep patient={selectedPatient} onSubmit={handleCreateFollowup} onBack={() => setStep('select_action')} isLoading={isLoading} branches={branches} currentUser={currentUser}/> )}
            {selectedPatient && step === 'appointment_form' && (
                <AppointmentFormStep 
                    patient={selectedPatient}
                    onSubmit={createAppointmentApi}
                    onBack={() => setStep('select_action')}
                    branches={branches}
                    currentUser={currentUser}
                    services={services}
                    getAppointmentsForDate={getAppointmentsForDate}
                    getCalendarBlockers={getCalendarBlockers}
                />
            )}
        </div>
      </div>
    </div>
  );
};


const SearchStep = ({ searchTerm, onSearchChange, results, onSelectPatient, onAddNew, isLoading }: any) => (
    <div>
        <h3 className="font-semibold text-lg text-slate-700 mb-2">1. Find Patient</h3>
        <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md"/>
        <div className="mt-4 max-h-60 overflow-auto">
            {isLoading && <div className="text-center p-4"><SpinnerIcon className="w-6 h-6 mx-auto"/></div>}
            {!isLoading && results.length > 0 && results.map((p: Patient) => ( <div key={p.id} onClick={() => onSelectPatient(p)} className="p-3 hover:bg-slate-100 cursor-pointer border-b"> <p className="font-semibold">{p.name}</p> <p className="text-sm text-slate-500">{p.phone}</p> </div> ))}
            {!isLoading && searchTerm.length > 1 && results.length === 0 && ( <div className="text-center p-8 text-slate-500"> <p>No patients found.</p> <button onClick={onAddNew} className="mt-2 text-blue-600 font-semibold hover:underline"> + Add a New Patient </button> </div> )}
        </div>
         {!isLoading && searchTerm.length > 1 && results.length > 0 && ( <button onClick={onAddNew} className="mt-4 w-full text-center p-3 bg-slate-100 rounded-md text-blue-600 font-semibold hover:bg-slate-200"> Can't find them? + Add a New Patient </button> )}
    </div>
);

import { PhotoUpload } from './PhotoUpload';
import { SignaturePadModal } from './SignaturePadModal';

const NewPatientStep = ({ onSubmit, onBack, isLoading }: any) => {
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        const patientData = {
            name: data.name,
            phone: data.phone,
            dob: data.dob,
            gender: data.gender,
            emergency_contact: {
                name: data['emergency_contact.name'],
                phone: data['emergency_contact.phone'],
                relation: 'N/A' // relation field not in form, so add a default
            },
            insurance: {
                provider: data['insurance.provider'],
                policy_number: data['insurance.policy_number']
            },
            preferred_communication: data.preferred_communication,
            photoFile: photoFile,
            signatureData: signatureData
        };
        onSubmit(patientData);
    };
    return (
        <div>
            <h3 className="font-semibold text-lg text-slate-700 mb-4">Add New Patient</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <PhotoUpload onPhotoSelected={setPhotoFile} />
                <div> <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label> <input name="name" type="text" required className="w-full p-2 border border-slate-300 rounded-md"/> </div>
                <div> <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label> <input name="phone" type="tel" required className="w-full p-2 border border-slate-300 rounded-md"/> </div>
                <div className="grid grid-cols-2 gap-4">
                    <div> <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label> <input name="dob" type="date" className="w-full p-2 border border-slate-300 rounded-md"/> </div>
                    <div> <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label> <select name="gender" className="w-full p-2 border border-slate-300 rounded-md"> <option value="Male">Male</option> <option value="Female">Female</option> <option value="Other">Other</option> </select> </div>
                </div>
                <h4 className="font-semibold text-md text-slate-700 mt-6 mb-2">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div> <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label> <input name="emergency_contact.name" type="text" className="w-full p-2 border border-slate-300 rounded-md"/> </div>
                    <div> <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label> <input name="emergency_contact.phone" type="tel" className="w-full p-2 border border-slate-300 rounded-md"/> </div>
                </div>
                <h4 className="font-semibold text-md text-slate-700 mt-6 mb-2">Insurance Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div> <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label> <input name="insurance.provider" type="text" className="w-full p-2 border border-slate-300 rounded-md"/> </div>
                    <div> <label className="block text-sm font-medium text-slate-700 mb-1">Policy Number</label> <input name="insurance.policy_number" type="text" className="w-full p-2 border border-slate-300 rounded-md"/> </div>
                </div>
                <h4 className="font-semibold text-md text-slate-700 mt-6 mb-2">Communication</h4>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Communication</label>
                    <select name="preferred_communication" className="w-full p-2 border border-slate-300 rounded-md">
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                    </select>
                </div>
                <div>
                    <button type="button" onClick={() => setIsSignatureModalOpen(true)} className="w-full text-center p-3 bg-slate-100 rounded-md text-blue-600 font-semibold hover:bg-slate-200">
                        {signatureData ? 'Consent Signed' : 'Sign Consent'}
                    </button>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onBack} className="px-4 py-2 border rounded-md">Back to Search</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"> {isLoading && <SpinnerIcon className="w-4 h-4"/>} Save and Continue </button>
                </div>
            </form>
            {isSignatureModalOpen && (
                <SignaturePadModal
                    onClose={() => setIsSignatureModalOpen(false)}
                    onSave={(signature) => {
                        setSignatureData(signature);
                        setIsSignatureModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

const SelectActionStep = ({ patient, onSelectAction, onBack }: any) => (
    <div>
        <h3 className="font-semibold text-lg text-slate-700 mb-2">2. Select Action</h3>
        <div className="bg-slate-100 p-4 rounded-lg mb-4"> <p>Selected Patient: <span className="font-bold">{patient.name}</span></p> <p className="text-sm text-slate-600">{patient.phone}</p> </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => onSelectAction('followup_form')} className="p-6 bg-blue-50 text-blue-800 rounded-lg text-center hover:bg-blue-100 border border-blue-200"> <h4 className="font-bold text-lg">Schedule Follow-up</h4> <p className="text-sm">Create a reminder for a future check-in.</p> </button>
            <button onClick={() => onSelectAction('appointment_form')} className="p-6 bg-green-50 text-green-800 rounded-lg text-center hover:bg-green-100 border border-green-200"> <h4 className="font-bold text-lg">Book Appointment</h4> <p className="text-sm">Schedule a new consultation or service.</p> </button>
        </div>
         <div className="mt-6 text-center"> <button onClick={onBack} className="text-sm text-slate-500 hover:underline">Back to search</button> </div>
    </div>
);

const FollowupFormStep = ({ patient, onSubmit, onBack, isLoading, branches, currentUser }: any) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const data = Object.fromEntries(formData.entries()); onSubmit(data); };
    return (
         <div>
            <h3 className="font-semibold text-lg text-slate-700 mb-4">Schedule Follow-up for {patient.name}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div> <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label> <input name="scheduled_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 border border-slate-300 rounded-md"/> </div>
                 <div> <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Reason</label> <textarea name="notes" required className="w-full p-2 border border-slate-300 rounded-md" rows={3}></textarea> </div>
                <div className="grid grid-cols-2 gap-4">
                    <div> <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label> <select name="priority" defaultValue="normal" className="w-full p-2 border border-slate-300 rounded-md"> <option value="low">Low</option> <option value="normal">Normal</option> <option value="high">High</option> <option value="urgent">Urgent</option> </select> </div>
                     <div> <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label> <select name="branch_id" defaultValue={currentUser.branch_id || branches[0].id} disabled={currentUser.role !== 'doctor'} className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 disabled:bg-slate-100"> {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)} </select> </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onBack} className="px-4 py-2 border rounded-md">Back</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"> {isLoading && <SpinnerIcon className="w-4 h-4"/>} Create Follow-up </button>
                </div>
            </form>
        </div>
    )
};

const AppointmentFormStep = ({ patient, onSubmit, onBack, branches, currentUser, services, getAppointmentsForDate, getCalendarBlockers }: any) => {
    const [serviceId, setServiceId] = useState<string>(services[0]?.id.toString() || '');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState<string>('');
    const [branchId, setBranchId] = useState<string>( (currentUser.branch_id || branches[0]?.id).toString() );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<{ time: string, isRecommended: boolean }[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const generateSlots = (appointments: Appointment[], blockers: CalendarBlocker[], duration: number): { time: string, isRecommended: boolean }[] => {
        const slots = [];
        const workHours = [{ start: 9, end: 13 }, { start: 14, end: 17 }]; // 9am-1pm, 2pm-5pm
        const interval = 15; // 15-minute intervals
        const now = new Date();
        const selectedDate = new Date(date + 'T00:00:00');
        const isToday = now.toDateString() === selectedDate.toDateString();

        const occupiedTimes = [
            ...appointments.map(a => ({ start: new Date(a.start_time), end: new Date(a.end_time) })),
            ...blockers.map(b => ({ start: new Date(b.start_time), end: new Date(b.end_time) }))
        ];

        for (const period of workHours) {
            for (let hour = period.start; hour < period.end; hour++) {
                for (let minute = 0; minute < 60; minute += interval) {
                    const slotStart = new Date(selectedDate);
                    slotStart.setHours(hour, minute, 0, 0);

                    if (isToday && slotStart < now) continue;

                    const slotEnd = new Date(slotStart.getTime() + duration * 60000);
                    if (slotEnd.getHours() > period.end || (slotEnd.getHours() === period.end && slotEnd.getMinutes() > 0)) continue;

                    const isOccupied = occupiedTimes.some(o => slotStart < o.end && slotEnd > o.start);
                    if (!isOccupied) {
                         const isRecommended = occupiedTimes.some(o => Math.abs(slotStart.getTime() - o.end.getTime()) < 1000 || Math.abs(o.start.getTime() - slotEnd.getTime()) < 1000);
                         slots.push({ time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, isRecommended });
                    }
                }
            }
        }
        slots.sort((a,b) => b.isRecommended ? 1 : -1);
        return slots;
    };

    useEffect(() => {
        const fetchAndGenerateSlots = async () => {
            if (!date || !serviceId) return;
            setIsLoadingSlots(true);
            try {
                const selectedService = services.find((s: Service) => s.id === Number(serviceId));
                if (!selectedService) return;
                
                const appointments = await getAppointmentsForDate(new Date(date), Number(branchId));
                const blockers = await getCalendarBlockers(new Date(date), 1); // Dr. Prasanna
                
                const slots = generateSlots(appointments, blockers, selectedService.duration_minutes);
                setAvailableSlots(slots);
                setTime(slots[0]?.time || '');
            } catch (error) {
                console.error("Failed to fetch schedule for suggestions", error);
                setAvailableSlots([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };
        fetchAndGenerateSlots();
    }, [date, serviceId, branchId, getAppointmentsForDate, getCalendarBlockers, services]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serviceId || !date || !time || !branchId) return;
        setIsSubmitting(true);
        await onSubmit({
            patient_id: patient.id,
            service_id: Number(serviceId),
            start_time: new Date(`${date}T${time}:00`).toISOString(),
            branch_id: Number(branchId),
            doctor_id: 1,
            status: 'confirmed',
        });
        setIsSubmitting(false);
    };

    return (
        <div>
            <h3 className="font-semibold text-lg text-slate-700 mb-4">Book Appointment for {patient.name}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <select name="service_id" value={serviceId} onChange={e => setServiceId(e.target.value)} required className="w-full p-2 border rounded-md">
                    {services.map((s: Service) => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
                </select>
                <select name="branch_id" value={branchId} onChange={e => setBranchId(e.target.value)} disabled={currentUser.role !== 'doctor'} className="w-full p-2 border rounded-md disabled:bg-slate-100">
                    {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input name="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-2 border rounded-md"/>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Available Times</label>
                    {isLoadingSlots ? <SpinnerIcon /> : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.map(({ time: slot, isRecommended }) => (
                                <button type="button" key={slot} onClick={() => setTime(slot)} className={`p-2 rounded-md text-sm border ${time === slot ? 'bg-blue-600 text-white border-blue-600' : isRecommended ? 'bg-green-100 border-green-300' : 'bg-white hover:bg-slate-50'}`}>
                                    {slot} {isRecommended && <SparklesIcon className="w-3 h-3 inline-block ml-1 text-green-700"/>}
                                </button>
                            ))}
                        </div>
                    ) : <p className="text-slate-500 text-sm">No available slots for this day.</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onBack} className="px-4 py-2 border rounded-md">Back</button>
                    <button type="submit" disabled={isSubmitting || !time} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:bg-blue-300">
                        {isSubmitting && <SpinnerIcon className="w-4 h-4"/>} Create Appointment
                    </button>
                </div>
            </form>
        </div>
    );
};