import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { SpinnerIcon, ClockIcon } from './icons';

interface WaitingRoomProps {
  waitingPatients: Appointment[];
  loading: boolean;
}

const formatDuration = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const WaitingPatientCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const calculateTime = () => {
            if (appointment.checked_in_time) {
                const checkedInDate = new Date(appointment.checked_in_time);
                const now = new Date();
                setElapsedTime((now.getTime() - checkedInDate.getTime()) / 1000);
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000); // update every second
        return () => clearInterval(interval);
    }, [appointment.checked_in_time]);

    const waitTimeSeconds = elapsedTime;
    const isLongWait = waitTimeSeconds > 10 * 60; // Over 10 minutes

    return (
        <div className={`p-4 rounded-lg shadow flex items-center justify-between ${isLongWait ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
            <div>
                <p className="font-bold text-lg text-slate-800">{appointment.patient.name}</p>
                <p className="text-sm text-slate-500">{appointment.service_name}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-slate-500">Waiting Time</p>
                <p className={`text-2xl font-mono font-bold ${isLongWait ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatDuration(waitTimeSeconds)}
                </p>
            </div>
        </div>
    );
};


export const WaitingRoom: React.FC<WaitingRoomProps> = ({ waitingPatients, loading }) => {
    if (loading) return <div className="flex justify-center items-center p-10"><SpinnerIcon className="w-8 h-8" /></div>;

    return (
        <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-8 h-8 text-blue-600"/>
                <div>
                    <h2 className="text-2xl font-bold text-slate-700">Live Waiting Room</h2>
                    <p className="text-slate-500">Patients currently checked-in and waiting for consultation.</p>
                </div>
            </div>

            {waitingPatients.length === 0 ? (
                <div className="text-center text-slate-500 py-20 border-2 border-dashed rounded-lg">
                    <p className="font-semibold">The waiting room is currently empty.</p>
                </div>
            ) : (
                <div className="space-y-4">
                   {waitingPatients.map(appointment => (
                       <WaitingPatientCard key={appointment.id} appointment={appointment} />
                   ))}
                </div>
            )}
        </div>
    );
};