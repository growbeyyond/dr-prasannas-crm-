import React, { useState, useEffect } from 'react';
import { DashboardStats, Toast } from '../types';
import { SpinnerIcon } from './icons';

interface DashboardProps {
    getStatsApi: () => Promise<DashboardStats>;
    runAutomatedRemindersApi: () => Promise<number>;
    addToast: (message: string, type: Toast['type']) => void;
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; }> = ({ title, value, subtext }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-slate-500 uppercase">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
        {subtext && <p className="text-sm text-slate-400 mt-1">{subtext}</p>}
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ getStatsApi, runAutomatedRemindersApi, addToast }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAutomationRunning, setIsAutomationRunning] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await getStatsApi();
                setStats(data);
            } catch (err) {
                setError("Failed to load dashboard data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [getStatsApi]);

    const handleRunReminders = async () => {
        setIsAutomationRunning(true);
        try {
            const count = await runAutomatedRemindersApi();
            addToast(`${count} reminders sent successfully for tomorrow's appointments.`, 'success');
        } catch (e) {
            addToast('Failed to run automated reminders.', 'error');
        } finally {
            setIsAutomationRunning(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-10"><SpinnerIcon className="w-8 h-8" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-10">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Welcome back! Here's a summary of today's activity.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Today's Revenue" value={`₹${stats?.todayRevenue.toLocaleString()}`} subtext="From paid invoices" />
                <StatCard title="Today's Appointments" value={stats?.todayAppointments.toString() || '0'} subtext="Total scheduled" />
                <StatCard title="Pending Follow-ups" value={stats?.pendingFollowups.toString() || '0'} subtext="For today" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Branch Performance (Today)</h2>
                    <div className="space-y-4">
                        {stats?.branchPerformance.map(branch => (
                            <div key={branch.branchName} className="bg-white p-6 rounded-lg shadow">
                                <h3 className="font-bold text-lg text-slate-700">{branch.branchName}</h3>
                                <div className="mt-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-slate-500">Revenue</p>
                                        <p className="text-2xl font-semibold text-slate-800">₹{branch.revenue.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Appointments</p>
                                        <p className="text-2xl font-semibold text-slate-800">{branch.appointments}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Daily Automation</h2>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold text-lg text-slate-700">Appointment Reminders</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-4">Run the daily job to send SMS/WhatsApp reminders for all appointments scheduled for tomorrow.</p>
                        <button 
                            onClick={handleRunReminders}
                            disabled={isAutomationRunning}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2">
                            {isAutomationRunning && <SpinnerIcon className="w-5 h-5"/>}
                            Send Tomorrow's Reminders
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};