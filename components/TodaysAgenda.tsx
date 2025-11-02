import React from 'react';
import { Appointment, User, AppointmentStatus, AgendaItem } from '../types';
import { SpinnerIcon, StethoscopeIcon, ReceiptIcon, ClockIcon, MessageIcon, SendIcon } from './icons';

interface TodaysAgendaProps {
  agendaItems: AgendaItem[];
  loading: boolean;
  onAppointmentUpdate: (appointment: Appointment, newStatus: AppointmentStatus) => void;
  currentUser: User;
  onStartConsultation: (appointment: Appointment) => void;
  onOpenBilling: (appointment: Appointment) => void;
  onOpenCommunication: (appointment: Appointment) => void;
  onSendReminder: (appointmentId: number) => Promise<void>;
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
    agendaItems,
    loading,
    onAppointmentUpdate,
    currentUser, 
    onStartConsultation,
    onOpenBilling,
    onOpenCommunication,
    onSendReminder,
}) => {
  
  const handleReminder = async (appointment: Appointment) => {
      await onSendReminder(appointment.id);
  }

  if (loading) return <div className="flex justify-center items-center p-10"><SpinnerIcon className="w-8 h-8" /></div>;
  if (!loading && agendaItems.length === 0) return <div className="text-center text-slate-500 py-16 bg-white shadow-lg rounded-lg p-6">No items scheduled for today.</div>;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-slate-700 mb-4">Today's Agenda ({new Date().toLocaleDateString('en-CA')})</h2>
      <div className="divide-y divide-slate-200">
        {agendaItems.map(item => {
          if (item.itemType === 'blocker') {
            return (
              <div key={`blocker-${item.id}`} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4 bg-slate-50">
                <div className="flex-1 flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-bold text-lg text-slate-600">{item.reason}</p>
                    <p className="text-sm text-slate-500">{new Date(item.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(item.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              </div>
            );
          }

          const appt = item;
          return (
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
                        <button onClick={() => onAppointmentUpdate(appt, 'checked_in')} className="px-4 py-2 border rounded-md text-sm bg-white hover:bg-slate-100">Check-in</button>
                    )}
                    {currentUser.role === 'receptionist' && appt.status === 'confirmed' && (
                        <button onClick={() => handleReminder(appt)} disabled={appt.reminder_sent} className="px-3 py-2 border rounded-md text-sm bg-white hover:bg-slate-100 text-slate-600 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                           <SendIcon/> {appt.reminder_sent ? 'Sent' : 'Reminder'}
                        </button>
                    )}
                    {currentUser.role === 'receptionist' && appt.status === 'completed' && appt.invoice_id && (
                         <button onClick={() => onOpenBilling(appt)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                           <ReceiptIcon /> Billing
                        </button>
                    )}

                    {/* DOCTOR ACTIONS */}
                    {currentUser.role === 'doctor' && ['confirmed', 'checked_in'].includes(appt.status) && (
                         <button onClick={() => { onAppointmentUpdate(appt, 'in_consult'); onStartConsultation(appt); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                           <StethoscopeIcon /> Start Consultation
                        </button>
                    )}
                    {currentUser.role === 'doctor' && appt.status === 'completed' && (
                        <button onClick={() => onStartConsultation(appt)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-md hover:bg-slate-100 flex items-center gap-2">
                           View Record
                        </button>
                    )}
                     <button onClick={() => onOpenCommunication(appt)} className="p-2 border rounded-md text-sm bg-white hover:bg-slate-100 text-slate-600">
                        <MessageIcon />
                    </button>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};