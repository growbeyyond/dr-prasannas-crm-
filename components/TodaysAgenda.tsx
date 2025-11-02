import React, { useState, useEffect, useCallback } from 'react';
import { Appointment, User, AppointmentStatus } from '../types';
import { SpinnerIcon, StethoscopeIcon, ReceiptIcon } from './icons';

interface TodaysAgendaProps {
  getAppointmentsApi: (date: Date, branchId: number | 'all') => Promise<Appointment[]>;
  updateAppointmentApi: (update: Partial<Appointment> & { id: number }) => Promise<Appointment>;
  selectedBranchId: number | 'all';
  currentUser: User;
  onStartConsultation: (appointment: Appointment) => void;
  onOpenBilling: (appointment: Appointment) => void;
}

const statusColors: Record<AppointmentStatus, string> = {
    pending: 'bg-gray-200 text-gray-800',
    confirmed: 'bg-blue-200 text-blue-800',
    checked_in: 'bg-yellow-200 text-yellow-800',
    in_consult: 'bg-indigo-200 text-indigo-800',
    completed: 'bg-green-200 text-green-800',
    canceled: 'bg-red-200 text-red-800',
};

export const TodaysAgenda: React.FC<TodaysAgendaProps> = ({ 
    getAppointmentsApi, 
    updateAppointmentApi,
    selectedBranchId, 
    currentUser, 
    onStartConsultation,
    onOpenBilling
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const data = await getAppointmentsApi(today, selectedBranchId);
      setAppointments(data);
    } catch (err) {
      setError('Failed to load appointments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getAppointmentsApi, selectedBranchId]);

  useEffect(() => {
    const interval = setInterval(fetchAppointments, 30000); // Auto-refresh every 30s
    fetchAppointments();
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const handleStatusChange = async (appointmentId: number, newStatus: AppointmentStatus) => {
    try {
        const updatedAppointment = await updateAppointmentApi({ id: appointmentId, status: newStatus });
        setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedAppointment : a));
    } catch (err) {
        alert('Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center items-center p-10"><SpinnerIcon className="w-8 h-8" /></div>;
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-slate-700 mb-4">Today's Appointments ({new Date().toLocaleDateString('en-CA')})</h2>
      {appointments.length === 0 ? (
        <div className="text-center text-slate-500 py-16">No appointments scheduled for today.</div>
      ) : (
        <div className="divide-y divide-slate-200">
          {appointments.map(appt => (
            <div key={appt.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4">
                <div className="flex-1">
                    <p className="font-bold text-lg text-slate-800">{appt.patient.name}</p>
                    <p className="text-sm text-slate-600">{appt.service_name}</p>
                    <p className="text-sm text-slate-500">{new Date(appt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(appt.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[appt.status]}`}>
                        {appt.status.replace('_', ' ')}
                    </span>

                    {/* RECEPTIONIST ACTIONS */}
                    {currentUser.role === 'receptionist' && appt.status === 'confirmed' && (
                        <button onClick={() => handleStatusChange(appt.id, 'checked_in')} className="px-4 py-2 border rounded-md text-sm bg-white hover:bg-slate-100">Check-in</button>
                    )}
                    {currentUser.role === 'receptionist' && appt.status === 'completed' && appt.invoice_id && (
                         <button onClick={() => onOpenBilling(appt)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                           <ReceiptIcon /> Billing
                        </button>
                    )}

                    {/* DOCTOR ACTIONS */}
                    {currentUser.role === 'doctor' && ['confirmed', 'checked_in'].includes(appt.status) && (
                         <button onClick={() => { handleStatusChange(appt.id, 'in_consult'); onStartConsultation(appt); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                           <StethoscopeIcon /> Start Consultation
                        </button>
                    )}
                    {currentUser.role === 'doctor' && appt.status === 'completed' && (
                        <button onClick={() => onStartConsultation(appt)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-md hover:bg-slate-100 flex items-center gap-2">
                           View Record
                        </button>
                    )}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};