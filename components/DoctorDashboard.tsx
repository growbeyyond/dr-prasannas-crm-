
import React from 'react';
import { Appointment } from '../types';

interface DoctorDashboardProps {
  todaysAppointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ todaysAppointments, onAppointmentClick }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
      <div className="space-y-4">
        {todaysAppointments.map((appt) => (
          <div
            key={appt.id}
            onClick={() => onAppointmentClick(appt)}
            className="p-4 border rounded-md cursor-pointer hover:bg-slate-50"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{appt.patient.name}</p>
                <p className="text-sm text-slate-600">{appt.service_name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{new Date(appt.start_time).toLocaleTimeString()}</p>
                <p className="text-sm text-slate-600">{appt.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
