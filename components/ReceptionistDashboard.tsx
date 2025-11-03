
import React from 'react';
import { Appointment } from '../types';
import { UserPlusIcon, CalendarPlusIcon, CoinsIcon } from './icons';

interface ReceptionistDashboardProps {
  todaysAppointments: Appointment[];
  onNewPatientClick: () => void;
  onBookAppointmentClick: () => void;
  onPaymentsClick: () => void;
}

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
  >
    <div className="mb-2">{icon}</div>
    <span className="font-semibold text-slate-700">{label}</span>
  </button>
);

export const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = ({
  todaysAppointments,
  onNewPatientClick,
  onBookAppointmentClick,
  onPaymentsClick,
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <QuickActionButton icon={<UserPlusIcon className="w-8 h-8 text-blue-500" />} label="New Patient" onClick={onNewPatientClick} />
        <QuickActionButton icon={<CalendarPlusIcon className="w-8 h-8 text-green-500" />} label="Book Appointment" onClick={onBookAppointmentClick} />
        <QuickActionButton icon={<CoinsIcon className="w-8 h-8 text-yellow-500" />} label="Payments" onClick={onPaymentsClick} />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Patient</th>
                <th className="py-2 px-4 border-b">Time</th>
                <th className="py-2 px-4 border-b">Service</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todaysAppointments.map((appt) => (
                <tr key={appt.id}>
                  <td className="py-2 px-4 border-b">{appt.patient.name}</td>
                  <td className="py-2 px-4 border-b">{new Date(appt.start_time).toLocaleTimeString()}</td>
                  <td className="py-2 px-4 border-b">{appt.service_name}</td>
                  <td className="py-2 px-4 border-b">{appt.status}</td>
                  <td className="py-2 px-4 border-b">
                    {/* Actions like Check-in will go here */}
                    <button className="text-blue-600 hover:underline">Check-in</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
