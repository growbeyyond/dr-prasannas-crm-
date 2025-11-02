import React from 'react';
import { Followup } from '../types';
import { PhoneIcon, CheckIcon, SnoozeIcon, CalendarPlusIcon, UserIcon, SpinnerIcon } from './icons';

interface FollowUpItemProps {
  followup: Followup;
  onMarkDone: (followup: Followup) => void;
  onSnooze: (followup: Followup, days: number) => void;
  isProcessing: boolean;
  onCreateAppointment: (followup: Followup) => void;
  onShowPatientHistory: (followup: Followup) => void;
  isSelected: boolean;
  onSelectToggle: (id: number) => void;
  canBulkAction: boolean;
}

const priorityClasses = {
  low: 'border-l-4 border-green-400',
  normal: 'border-l-4 border-blue-400',
  high: 'border-l-4 border-yellow-400',
  urgent: 'border-l-4 border-red-500 animate-pulse',
};

export const FollowUpItem: React.FC<FollowUpItemProps> = ({ 
    followup, 
    onMarkDone, 
    onSnooze, 
    isProcessing, 
    onCreateAppointment, 
    onShowPatientHistory,
    isSelected,
    onSelectToggle,
    canBulkAction 
}) => {
  const isOverdue = followup.status === 'pending' && new Date(followup.scheduled_date) < new Date(new Date().toDateString());
  const isDone = followup.status === 'done';

  const callNumber = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm transition-shadow hover:shadow-md flex items-start md:items-center p-3 gap-3 ${priorityClasses[followup.priority]} ${isOverdue ? 'bg-red-50' : ''} ${isDone ? 'bg-slate-100 opacity-60' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {canBulkAction && (
          <div className="flex items-center h-full pt-1 md:pt-0">
              <input type="checkbox" checked={isSelected} onChange={() => onSelectToggle(followup.id)} className="h-4 w-4 rounded" />
          </div>
      )}
      <div className={`flex-grow ${isDone ? 'line-through text-slate-500' : ''}`}>
        <div className="font-bold text-slate-800">{followup.patient?.name}
          <span className="text-sm font-normal text-slate-500 ml-2">({followup.patient?.phone})</span>
          {isOverdue && <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">OVERDUE</span>}
        </div>
        <div className="text-sm text-slate-600 mt-1">{followup.scheduled_time || 'Any time'} &bull; {followup.notes}</div>
        <div className="text-xs text-slate-500 mt-2 flex gap-2 items-center">
            <span>Priority: <span className="font-semibold">{followup.priority}</span></span>
            {followup.recurrence && <span>&bull; Recurrence: {followup.recurrence.interval} {followup.recurrence.type}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap justify-start md:justify-end w-full md:w-auto self-end">
        <button onClick={() => callNumber(followup.patient.phone)} disabled={isProcessing || isDone} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <PhoneIcon/> Call
        </button>
        <button onClick={() => onSnooze(followup, 1)} disabled={isProcessing || isDone} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <SnoozeIcon/> Snooze +1d
        </button>
        <button onClick={() => onShowPatientHistory(followup)} disabled={isProcessing || isDone} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <UserIcon/> History
        </button>
        <button onClick={() => onCreateAppointment(followup)} disabled={isProcessing || isDone} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300 disabled:cursor-not-allowed">
            <CalendarPlusIcon/> Create Appt
        </button>
        <button onClick={() => onMarkDone(followup)} disabled={isProcessing || isDone} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-white ${isDone ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} disabled:bg-green-300`}>
             {isProcessing ? <SpinnerIcon className="w-4 h-4"/> : <CheckIcon/>} {isDone ? 'Completed' : 'Done'}
        </button>
      </div>
    </div>
  );
};