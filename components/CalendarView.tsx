
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useMockApi } from '../hooks/useMockApi';

interface CalendarViewProps {
  onDateClick: (date: Date) => void;
  selectedBranchId: number | 'all';
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onDateClick, selectedBranchId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { getFollowupCounts } = useMockApi();

  const followupCounts = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return getFollowupCounts(start, end, selectedBranchId);
  }, [currentDate, selectedBranchId, getFollowupCounts]);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const days = Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} className="border-r border-b border-slate-200"></div>);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    const isToday = new Date().toISOString().split('T')[0] === dateString;
    const count = followupCounts[dateString] || 0;

    days.push(
      <div
        key={day}
        className="p-2 border-r border-b border-slate-200 cursor-pointer transition-colors hover:bg-blue-50 relative aspect-square flex flex-col"
        onClick={() => onDateClick(date)}
      >
        <div className={`font-semibold ${isToday ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center' : 'text-slate-600'}`}>
          {day}
        </div>
        {count > 0 && (
          <div className="absolute bottom-2 right-2 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {count}
          </div>
        )}
      </div>
    );
  }

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-200">
            <ChevronLeftIcon />
        </button>
        <h2 className="text-xl font-bold text-slate-700">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-200">
            <ChevronRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {weekdays.map(day => (
          <div key={day} className="text-center font-bold text-slate-500 py-2 border-b-2 border-slate-200">{day}</div>
        ))}
        {days}
      </div>
    </div>
  );
};
