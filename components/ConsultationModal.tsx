import React, { useState, useEffect } from 'react';
import { Appointment, Patient, Vitals, PrescriptionItem, ClinicalNoteTemplate, User } from '../types';
import { SpinnerIcon, HeartPulseIcon, FileTextIcon, PillIcon, TrashIcon, PrintIcon, TemplateIcon, SparklesIcon } from './icons';

interface ConsultationModalProps {
  appointment: Appointment;
  onClose: () => void;
  onComplete: (appointmentId: number, data: { vitals: Vitals; notes: string; prescription: PrescriptionItem[] }) => Promise<void>;
  onShowPatientHistory: (patient: Patient) => void;
  getNoteTemplatesApi: (doctorId: number) => Promise<ClinicalNoteTemplate[]>;
  currentUser: User;
  getLatestNoteForPatientApi: (patientId: number) => Promise<string | null>;
}

// Gemini AI Simulation
const summarizeNotes = async (notes: string): Promise<string> => {
    // In a real app, this would be an API call to Gemini.
    await new Promise(res => setTimeout(res, 800));
    if (!notes) return "No previous notes available for summary.";
    // Simple summary logic for demo
    const sentences = notes.split('.').filter(s => s.trim().length > 0);
    return `Summary of last visit: ${sentences[0]}. Key points include patient response to treatment and recommendations for follow-up.`;
};

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  appointment,
  onClose,
  onComplete,
  onShowPatientHistory,
  getNoteTemplatesApi,
  currentUser,
  getLatestNoteForPatientApi,
}) => {
  const [vitals, setVitals] = useState<Vitals>(appointment.vitals || { bp: '', temp: 0, weight: 0 });
  const [notes, setNotes] = useState(appointment.notes || '');
  const [prescription, setPrescription] = useState<PrescriptionItem[]>(appointment.prescription || []);
  const [newMed, setNewMed] = useState({ medicine: '', dosage: '', frequency: '', duration: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<ClinicalNoteTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  const isCompleted = appointment.status === 'completed';

  useEffect(() => {
    const generateSummary = async () => {
        if (!isCompleted) {
            setIsLoadingSummary(true);
            try {
                const latestNotes = await getLatestNoteForPatientApi(appointment.patient.id);
                if (latestNotes) {
                    const aiSummary = await summarizeNotes(latestNotes);
                    setSummary(aiSummary);
                } else {
                    setSummary('No previous consultation notes found for this patient.');
                }
            } catch (e) {
                setSummary('Could not generate AI summary.');
            } finally {
                setIsLoadingSummary(false);
            }
        }
    };
    generateSummary();
  }, [appointment.patient.id, getLatestNoteForPatientApi, isCompleted]);

  useEffect(() => {
      if (!isCompleted && currentUser.role === 'doctor') {
          getNoteTemplatesApi(currentUser.id).then(setTemplates).catch(console.error);
      }
  }, [getNoteTemplatesApi, currentUser.id, isCompleted, currentUser.role]);

  const handleUseTemplate = (content: string) => {
      setNotes(prev => `${prev}${prev ? '\n' : ''}${content}`);
      setShowTemplates(false);
  }

  const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVitals(prev => ({ ...prev, [name]: name === 'bp' ? value : Number(value) }));
  };

  const handleAddMedicine = () => {
      if (newMed.medicine.trim() && newMed.dosage.trim()) {
          setPrescription(prev => [...prev, { ...newMed, id: Date.now() }]);
          setNewMed({ medicine: '', dosage: '', frequency: '', duration: '' });
      }
  };
  
  const handleRemoveMedicine = (id: number) => {
      setPrescription(prev => prev.filter(med => med.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onComplete(appointment.id, { vitals, notes, prescription });
    setIsSubmitting(false);
  };
  
  const getAge = (dob: string | undefined): number | 'N/A' => dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl flex flex-col max-h-[90vh] printable-area" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b no-print">
            <h2 className="text-2xl font-bold text-slate-800">{isCompleted ? 'Consultation Record' : 'Start Consultation'}</h2>
            <div className="text-slate-600 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span><strong>Patient:</strong> {appointment.patient.name} ({getAge(appointment.patient.dob)} yrs)</span>
                <span className="text-slate-400">|</span>
                <span><strong>Service:</strong> {appointment.service_name}</span>
                 <span className="text-slate-400">|</span>
                <button type="button" onClick={() => onShowPatientHistory(appointment.patient)} className="text-blue-600 hover:underline font-semibold">View Full History</button>
            </div>
          </div>

          <div className="p-6 flex-grow overflow-auto space-y-6">
            {/* Vitals Section */}
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2"><HeartPulseIcon /> Vitals</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input name="bp" type="text" placeholder="BP (e.g., 120/80)" value={vitals.bp} onChange={handleVitalsChange} disabled={isCompleted} className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-100"/>
                    <input name="temp" type="number" step="0.1" placeholder="Temp (°C)" value={vitals.temp || ''} onChange={handleVitalsChange} disabled={isCompleted} className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-100"/>
                    <input name="weight" type="number" step="0.1" placeholder="Weight (kg)" value={vitals.weight || ''} onChange={handleVitalsChange} disabled={isCompleted} className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-100"/>
                </div>
            </div>

            {/* Clinical Notes Section */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2"><FileTextIcon /> Clinical Notes</h3>
                    {!isCompleted && templates.length > 0 && (
                        <div className="relative">
                            <button type="button" onClick={() => setShowTemplates(prev => !prev)} className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                                <TemplateIcon className="w-4 h-4" /> Use Template
                            </button>
                            {showTemplates && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border max-h-60 overflow-y-auto">
                                    {templates.map(t => (
                                        <a key={t.id} href="#" onClick={(e) => { e.preventDefault(); handleUseTemplate(t.content); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 truncate" title={t.name}>
                                            {t.name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {!isCompleted && (
                    <div className="p-3 mb-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <div className="flex items-center gap-2 font-semibold text-blue-800 mb-1"><SparklesIcon /> AI Summary of Last Visit</div>
                        {isLoadingSummary ? <div className="flex items-center gap-2 text-slate-500"><SpinnerIcon className="w-4 h-4"/> Generating...</div> : <p className="text-slate-700">{summary}</p>}
                    </div>
                )}
                <textarea name="notes" placeholder="Enter symptoms, diagnosis..." value={notes} onChange={e => setNotes(e.target.value)} disabled={isCompleted} className="w-full p-2 border border-slate-300 rounded-md h-32 resize-y disabled:bg-slate-100"></textarea>
            </div>

            {/* E-Prescription Section */}
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2"><PillIcon /> E-Prescription</h3>
                {!isCompleted && (
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4 p-3 bg-slate-50 rounded-lg border">
                        <input value={newMed.medicine} onChange={e => setNewMed({...newMed, medicine: e.target.value})} placeholder="Medicine Name" className="sm:col-span-2 p-2 border rounded-md" />
                        <input value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} placeholder="Dosage (e.g., 500mg)" className="p-2 border rounded-md"/>
                        <input value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} placeholder="Frequency (e.g., 1-0-1)" className="p-2 border rounded-md"/>
                        <button type="button" onClick={handleAddMedicine} className="bg-blue-500 text-white rounded-md hover:bg-blue-600 p-2">Add</button>
                    </div>
                )}
                <div className="space-y-2">
                    {prescription.map(med => (
                        <div key={med.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center p-2 bg-white border rounded-md">
                            <strong className="sm:col-span-2">{med.medicine}</strong>
                            <span>{med.dosage}</span>
                            <span>{med.frequency}</span>
                            {!isCompleted && <button type="button" onClick={() => handleRemoveMedicine(med.id)} className="text-red-500 hover:text-red-700 justify-self-end"><TrashIcon /></button>}
                        </div>
                    ))}
                    {prescription.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No medicines added.</p>}
                </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 flex justify-between items-center gap-3 rounded-b-lg no-print">
            <div>
                 {isCompleted && prescription.length > 0 && <button type="button" onClick={() => window.print()} className="px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-slate-50 flex items-center gap-2"><PrintIcon/> Print Prescription</button>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50">{isCompleted ? 'Close' : 'Cancel'}</button>
              {!isCompleted && <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2">{isSubmitting && <SpinnerIcon className="w-4 h-4" />}Complete Appointment</button>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};