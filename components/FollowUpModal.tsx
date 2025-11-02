import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Followup, Priority, User, Patient } from '../types';
import { FollowUpItem } from './FollowUpItem';
import { SpinnerIcon } from './icons';

interface FollowUpModalProps {
  date: Date;
  branchId: number | 'all';
  initialFollowups: Followup[];
  loading: boolean;
  onClose: () => void;
  onUpdate: (updatedFollowups: Followup[]) => void;
  updateFollowupApi: (followup: Partial<Followup> & { id: number }) => Promise<Followup>;
  createFollowupApi: (followupData: Omit<Followup, 'id' | 'patient'> & { patient_id: number }) => Promise<Followup>;
  currentUser: User;
  onInitiateAppointment: (patient: Patient) => void;
  onShowPatientHistory: (patient: Patient) => void;
}

type FilterType = 'all' | 'pending' | 'snoozed';

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  date,
  branchId,
  initialFollowups,
  loading,
  onClose,
  onUpdate,
  updateFollowupApi,
  createFollowupApi,
  currentUser,
  onInitiateAppointment,
  onShowPatientHistory,
}) => {
  const [followups, setFollowups] = useState<Followup[]>(initialFollowups);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFollowups(initialFollowups);
  }, [initialFollowups]);

  const handleMarkDone = useCallback(async (fup: Followup) => {
    setProcessingId(fup.id);
    try {
      await updateFollowupApi({ id: fup.id, status: 'done' });
      let nextFollowupToast: string | null = null;

      if (fup.recurrence) {
        const nextDate = new Date(fup.scheduled_date + 'T00:00:00');
        const { type, interval } = fup.recurrence;
        if (type === 'daily') nextDate.setDate(nextDate.getDate() + interval);
        // Add more recurrence logic here...
        
        const newFollowupData = {
          patient_id: fup.patient.id,
          doctor_id: fup.doctor_id,
          branch_id: fup.branch_id,
          scheduled_date: nextDate.toISOString().split('T')[0],
          scheduled_time: fup.scheduled_time,
          status: 'pending' as const,
          priority: fup.priority,
          recurrence: fup.recurrence,
          notes: fup.notes,
          created_by: currentUser.id,
        };
        await createFollowupApi(newFollowupData);
        nextFollowupToast = `Next follow-up scheduled for ${nextDate.toLocaleDateString()}.`;
      }

      // FIX: Explicitly cast status to the 'FollowupStatus' literal type.
      // TypeScript was inferring 'done' as a generic string, which caused a type mismatch.
      const updatedList = followups.map(item => 
        item.id === fup.id ? { ...item, status: 'done' as const } : item
      );
      setFollowups(updatedList);
      onUpdate(updatedList);

      if (nextFollowupToast) {
        alert(nextFollowupToast); // Replace with a proper toast notification
      }
    } catch (err) {
      console.error(err);
      alert('Failed to mark done');
    } finally {
      setProcessingId(null);
    }
  }, [followups, onUpdate, updateFollowupApi, createFollowupApi, currentUser.id]);
  
  const handleSnooze = useCallback(async (fup: Followup, days: number) => {
    setProcessingId(fup.id);
    try {
        const newDate = new Date(fup.scheduled_date + 'T00:00:00');
        newDate.setDate(newDate.getDate() + days);
        const isoDate = newDate.toISOString().split('T')[0];

        await updateFollowupApi({ id: fup.id, scheduled_date: isoDate, status: 'snoozed' });

        const updatedList = followups.filter(x => x.id !== fup.id); // Remove from current date's list
        setFollowups(updatedList);
        onUpdate(updatedList);
        alert(`Follow-up snoozed to ${isoDate}.`);
    } catch (err) {
        console.error(err);
        alert('Failed to snooze');
    } finally {
        setProcessingId(null);
    }
  }, [followups, onUpdate, updateFollowupApi]);

  const handleCreateAppointment = useCallback((followup: Followup) => {
    onInitiateAppointment(followup.patient);
  }, [onInitiateAppointment]);

  const handleShowHistory = useCallback((followup: Followup) => {
    onShowPatientHistory(followup.patient);
  }, [onShowPatientHistory]);

  const filteredFollowups = useMemo(() => {
    let sorted = [...followups].sort((a, b) => {
        const priorityOrder: Record<Priority, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    let results = sorted;
    if (filter !== 'all') {
      results = results.filter(f => f.status === filter);
    }

    if (searchTerm.trim()) {
      results = results.filter(f => 
        f.patient.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
      );
    }

    return results;
  }, [followups, filter, searchTerm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-50 w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Follow-ups for {date.toLocaleDateString('en-CA')}</h2>
            <p className="text-sm text-slate-500">
                Branch: {typeof branchId === 'number' ? `Branch ${branchId}` : 'All Branches'} ({filteredFollowups.length} of {followups.length} showing)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
             <input
                type="text"
                placeholder="Search patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            <div className="flex items-center gap-2">
                <div className="flex rounded-md shadow-sm flex-grow">
                    <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-l-md border flex-grow justify-center ${filter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50'}`}>All</button>
                    <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 text-sm border-t border-b flex-grow justify-center ${filter === 'pending' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50'}`}>Pending</button>
                    <button onClick={() => setFilter('snoozed')} className={`px-3 py-1.5 text-sm rounded-r-md border flex-grow justify-center ${filter === 'snoozed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50'}`}>Snoozed</button>
                </div>
                <button className="text-slate-500 hover:text-slate-800 text-2xl h-full px-2" onClick={onClose}>&times;</button>
            </div>
          </div>
        </div>

        <div className="p-4 flex-grow overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8" /></div>
          ) : filteredFollowups.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              {searchTerm ? 'No follow-ups match your search.' : `No ${filter !== 'all' ? filter : ''} follow-ups for this date.`}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFollowups.map(f => (
                <FollowUpItem 
                    key={f.id} 
                    followup={f} 
                    onMarkDone={handleMarkDone} 
                    onSnooze={handleSnooze}
                    isProcessing={processingId === f.id} 
                    onCreateAppointment={handleCreateAppointment}
                    onShowPatientHistory={handleShowHistory}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
            <button className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50" disabled>Bulk Actions</button>
            <button className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
