
import React from 'react';

interface AdminDashboardProps {
  stats: {
    appointmentsToday: number;
    noShows: number;
    revenueToday: number;
  };
}

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-slate-600">{title}</h3>
    <p className="text-3xl font-bold text-slate-800">{value}</p>
  </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <StatCard title="Appointments Today" value={stats.appointmentsToday} />
      <StatCard title="No-Shows" value={stats.noShows} />
      <StatCard
        title="Revenue Today"
        value={`$${stats.revenueToday.toLocaleString()}`}
      />
    </div>
  );
};
