import React, { useState, useEffect } from 'react';
import { Patient, Service, Branch, User, Appointment, CalendarBlocker } from '../types';
import { SpinnerIcon, SparklesIcon } from './icons';

interface CreateAppointmentModalProps {
  patient: Patient;
  services: Service[];
  branches: Branch[];
  currentUser: User;
  onClose: () => void;
  onCreateAppointment: (data: Omit<Appointment, 'id' | 'end_time' | 'patient' | 'service_name' | 'reminder_sent'>) => Promise<void>;
  getAppointmentsForDate: (date: Date, branchId: number | 'all') => Promise<Appointment[]>;
  getCalendarBlockers: (date: Date, doctorId: number) => Promise<CalendarBlocker[]>;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  patient,
  services,
  branches,
  currentUser,
  onClose,
  onCreateAppointment,
  getAppointmentsForDate,
  getCalendarBlockers
}) => {
  const [serviceId, setServiceId] = useState<string>(services[0]?.id.toString() || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('');
  const [branchId, setBranchId] = useState<string>((currentUser.branch_id || branches[0]?.id).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ time: string, isRecommended: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const generateSlots = (appointments: Appointment[], blockers: CalendarBlocker[], duration: number): { time: string, isRecommended: boolean }[] => {
    const slots = [];
    const workHours = [{ start: 9, end: 13 }, { start: 14, end: 17 }];
    const interval = 15;
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
    slots.sort((a,b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
    return slots;
  };

  useEffect(() => {
    const fetchAndGenerateSlots = async () => {
      if (!date || !serviceId) return;
      setIsLoadingSlots(true);
      try {
        const selectedService = services.find(s => s.id === Number(serviceId));
        if (!selectedService) return;
        
        const appointments = await getAppointmentsForDate(new Date(date), Number(branchId));
        const blockers = await getCalendarBlockers(new Date(date), 1);
        
        const slots = generateSlots(appointments, blockers, selectedService.duration_minutes);
        setAvailableSlots(slots);
        setTime(slots[0]?.time || '');
      } catch (error) {
        console.error("Failed to fetch schedule", error);
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
    await onCreateAppointment({
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-slate-800">New Appointment</h2>
            <p className="text-slate-600 mt-1">For: <span className="font-semibold">{patient.name}</span></p>
          </div>
          <div className="p-6 space-y-4">
            <select id="service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full p-2 border rounded-md" required>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
            </select>
            {currentUser.role !== 'receptionist' && (
              <select id="branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full p-2 border rounded-md" required>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded-md" min={new Date().toISOString().split('T')[0]} required/>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Available Times</label>
              {isLoadingSlots ? <SpinnerIcon /> : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.slice(0, 12).map(({ time: slot, isRecommended }) => (
                    <button type="button" key={slot} onClick={() => setTime(slot)} className={`p-2 rounded-md text-sm border ${time === slot ? 'bg-blue-600 text-white border-blue-600' : isRecommended ? 'bg-green-100 border-green-300' : 'bg-white hover:bg-slate-50'}`}>
                      {slot} {isRecommended && <SparklesIcon className="w-3 h-3 inline-block ml-1 text-green-700"/>}
                    </button>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm p-4 bg-slate-50 rounded-md">No available slots for this day.</p>}
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={isSubmitting || !time} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:bg-blue-300">
              {isSubmitting && <SpinnerIcon className="w-4 h-4" />} Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};