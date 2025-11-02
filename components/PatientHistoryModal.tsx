import React, { useState } from 'react';
import { Patient, HistoryItem, PatientDocument, Appointment } from '../types';
import { SpinnerIcon, ClipboardListIcon, StethoscopeIcon, DocumentIcon, UploadIcon, PhoneIcon, WhatsAppIcon, PrintIcon } from './icons';

interface PatientHistoryModalProps {
  patient: Patient;
  history: HistoryItem[];
  documents: PatientDocument[];
  allAppointments: Appointment[];
  loading: boolean;
  onClose: () => void;
}

type Tab = 'timeline' | 'vitals' | 'documents';

const getAge = (dob: string | undefined): number | 'N/A' => dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 'N/A';

const VitalsChart: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
    const vitalsHistory = appointments
        .filter(a => a.vitals && a.status === 'completed')
        .map(a => ({
            date: new Date(a.start_time).toLocaleDateString('en-CA'),
            ...a.vitals,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (vitalsHistory.length === 0) {
        return <p className="text-slate-500 text-center py-8">No vitals recorded in past appointments.</p>;
    }

    return (
        <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-slate-700">Vitals History</h4>
            <p className="text-sm text-slate-500 mb-4">(Chart placeholder: A line chart would be displayed here)</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">BP (Sys/Dia)</th>
                            <th scope="col" className="px-6 py-3">Temp (°C)</th>
                            <th scope="col" className="px-6 py-3">Weight (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vitalsHistory.map((v, index) => (
                            <tr key={index} className="bg-white border-b">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{v.date}</th>
                                <td className="px-6 py-4">{v.bp || 'N/A'}</td>
                                <td className="px-6 py-4">{v.temp || 'N/A'}</td>
                                <td className="px-6 py-4">{v.weight || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PrintableReport: React.FC<{ patient: Patient, history: HistoryItem[] }> = ({ patient, history }) => (
    <div className="print-only hidden p-8">
        <h1 className="text-3xl font-bold">Patient Report</h1>
        <p className="text-lg mb-6">Dr. Prasanna's Clinic</p>
        
        <div className="mb-6 border-b pb-4">
            <p><strong>Patient:</strong> {patient.name}</p>
            <p><strong>Age:</strong> {getAge(patient.dob)}</p>
            <p><strong>Phone:</strong> {patient.phone}</p>
            <p><strong>Report Generated:</strong> {new Date().toLocaleString()}</p>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Medical History</h2>
        <div className="space-y-4">
            {history.map(item => (
                <div key={`${item.type}-${item.id}`} className="pb-2 border-b">
                    <p><strong>Date:</strong> {new Date(item.event_date).toLocaleDateString()}</p>
                    <p><strong>Type:</strong> <span className="capitalize">{item.type}</span></p>
                    <p><strong>Details:</strong> {item.service_name || item.notes}</p>
                    {item.type === 'appointment' && item.notes && <p className="mt-1"><strong>Notes:</strong> {item.notes}</p>}
                </div>
            ))}
        </div>
    </div>
);


export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, history, documents, allAppointments, loading, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('timeline');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[75] p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl flex flex-col max-h-[90vh] printable-area" onClick={e => e.stopPropagation()}>
        <PrintableReport patient={patient} history={history} />
        <div className="p-6 border-b no-print">
            <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">Patient History</h2>
                    <p className="text-slate-600 mt-1">
                        <span className="font-semibold">{patient.name}</span> ({getAge(patient.dob)} yrs) - {patient.phone}
                    </p>
                 </div>
                 <div className="flex items-center gap-2">
                    <a href={`tel:${patient.phone}`} className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-slate-50">
                        <PhoneIcon /> Call
                    </a>
                     <a href={`https://wa.me/${patient.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-slate-50">
                        <WhatsAppIcon /> WhatsApp
                    </a>
                 </div>
            </div>
        </div>

        <div className="border-b border-slate-200 no-print">
            <nav className="flex -mb-px px-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('timeline')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                    Timeline
                </button>
                <button onClick={() => setActiveTab('vitals')} className={`ml-8 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vitals' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                    Vitals Chart
                </button>
                 <button onClick={() => setActiveTab('documents')} className={`ml-8 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                    Documents ({documents.length})
                </button>
            </nav>
        </div>
        
        <div className="p-6 flex-grow overflow-auto no-print">
            {loading ? <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8" /></div> : (
                <>
                    {activeTab === 'timeline' && (
                        <div className="space-y-4">
                            {history.length === 0 ? <p className="text-slate-500 text-center py-8">No history found for this patient.</p> : history.map(item => (
                                <div key={`${item.type}-${item.id}`} className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${item.type === 'appointment' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {item.type === 'appointment' ? <StethoscopeIcon /> : <ClipboardListIcon />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 capitalize">{item.type}: {item.service_name || item.notes?.substring(0, 30) + '...'}</p>
                                        <p className="text-sm text-slate-500">{new Date(item.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p className="text-sm text-slate-600 mt-1">{item.notes}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'vitals' && <VitalsChart appointments={allAppointments} />}

                    {activeTab === 'documents' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg text-slate-700">Patient Documents</h3>
                                <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-slate-50">
                                    <UploadIcon /> Upload New
                                </button>
                            </div>
                            <div className="space-y-2">
                                {documents.length === 0 ? <p className="text-slate-500 text-center py-8">No documents uploaded.</p> : documents.map(doc => (
                                    <a href={doc.url} key={doc.id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 border">
                                        <DocumentIcon className="text-slate-500"/>
                                        <div>
                                            <p className="font-medium text-blue-700">{doc.name}</p>
                                            <p className="text-xs text-slate-500">Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-between gap-3 rounded-b-lg border-t no-print">
            <button type="button" onClick={() => window.print()} className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2"><PrintIcon className="w-4 h-4"/>Print Report</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
};