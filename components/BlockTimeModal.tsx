import React, { useState } from 'react';
import { CalendarBlocker, User } from '../types';
import { SpinnerIcon, ClockIcon } from './icons';

interface BlockTimeModalProps {
  onClose: () => void;
  onCreateBlocker: (blockerData: Omit<CalendarBlocker, 'id'>) => Promise<void>;
  currentUser: User;
}

export const BlockTimeModal: React.FC<BlockTimeModalProps> = ({ onClose, onCreateBlocker, currentUser }) => {
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('Lunch Break');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || !reason) {
      alert('Please fill all fields.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const start_time = new Date(`${today}T${startTime}:00`).toISOString();
    const end_time = new Date(`${today}T${endTime}:00`).toISOString();

    if (new Date(start_time) >= new Date(end_time)) {
        alert('End time must be after start time.');
        return;
    }

    setIsSubmitting(true);
    await onCreateBlocker({
      start_time,
      end_time,
      reason,
      doctor_id: currentUser.id, // Assuming the blocker is for the logged-in doctor
    });
    setIsSubmitting(false);
  };

  const availableTimeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b flex items-center gap-3">
            <ClockIcon className="w-6 h-6 text-slate-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Block Time on Agenda</h2>
              <p className="text-slate-500">Create a non-appointment block for today.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                <select
                  id="start-time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {availableTimeSlots.map(slot => <option key={`start-${slot}`} value={slot}>{slot}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="end-time" className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                <select
                  id="end-time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                   {availableTimeSlots.map(slot => <option key={`end-${slot}`} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <input
                id="reason"
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
            >
              {isSubmitting && <SpinnerIcon className="w-4 h-4" />}
              Create Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
