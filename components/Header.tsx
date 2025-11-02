import React, { useState, useEffect, useRef } from 'react';
import { User, Branch, Patient } from '../types';
import { UserPlusIcon, CogIcon, LogoutIcon, ChevronDownIcon, ChartBarIcon, ClockIcon, SearchIcon, SpinnerIcon } from './icons';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  branches: Branch[];
  selectedBranchId: number | 'all';
  onBranchChange: (branchId: number | 'all') => void;
  onNewPatientClick: () => void;
  onBlockTimeClick: () => void;
  currentView: string;
  setView: (view: 'dashboard' | 'agenda' | 'calendar' | 'settings' | 'waiting_room') => void;
  searchPatientsApi: (term: string) => Promise<Patient[]>;
  onShowPatientHistory: (patient: Patient) => void;
}

const NavButton: React.FC<{ isActive: boolean, onClick: () => void, children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>
        {children}
    </button>
);

const GlobalSearch: React.FC<{ searchPatientsApi: (term: string) => Promise<Patient[]>; onShowPatientHistory: (patient: Patient) => void; }> = ({ searchPatientsApi, onShowPatientHistory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    
    useEffect(() => {
        if (searchTerm.length < 2) {
            setResults([]);
            return;
        }
        const debounce = setTimeout(async () => {
            setIsLoading(true);
            const data = await searchPatientsApi(searchTerm);
            setResults(data);
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(debounce);
    }, [searchTerm, searchPatientsApi]);
    
    const handleSelect = (patient: Patient) => {
        onShowPatientHistory(patient);
        setSearchTerm('');
        setResults([]);
        setIsFocused(false);
    }

    return (
        <div className="relative w-64" ref={searchRef}>
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                <input 
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                 {isLoading && <SpinnerIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />}
            </div>
            {isFocused && (searchTerm.length > 0) && (
                 <div className="absolute right-0 mt-2 w-full bg-white rounded-md shadow-lg py-1 z-50 border max-h-80 overflow-y-auto">
                     {results.length > 0 ? results.map(patient => (
                         <a href="#" key={patient.id} onClick={(e) => { e.preventDefault(); handleSelect(patient); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                             <p className="font-semibold">{patient.name}</p>
                             <p className="text-xs text-slate-500">{patient.phone}</p>
                         </a>
                     )) : !isLoading && <p className="px-4 py-3 text-sm text-slate-500">No results found.</p>}
                 </div>
            )}
        </div>
    );
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  branches,
  selectedBranchId,
  onBranchChange,
  onNewPatientClick,
  onBlockTimeClick,
  currentView,
  setView,
  searchPatientsApi,
  onShowPatientHistory
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDoctorOrAdmin = ['doctor', 'admin'].includes(currentUser.role);

  return (
    <header className="bg-white shadow-sm p-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="text-2xl font-bold text-slate-700">
          Dr. Prasanna's <span className="text-blue-600">CRM</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
            <NavButton isActive={currentView === 'dashboard'} onClick={() => setView('dashboard')}>Dashboard</NavButton>
            <NavButton isActive={currentView === 'agenda'} onClick={() => setView('agenda')}>Today's Agenda</NavButton>
            <NavButton isActive={currentView === 'waiting_room'} onClick={() => setView('waiting_room')}>Waiting Room</NavButton>
            <NavButton isActive={currentView === 'calendar'} onClick={() => setView('calendar')}>Follow-ups</NavButton>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <GlobalSearch searchPatientsApi={searchPatientsApi} onShowPatientHistory={onShowPatientHistory} />
        <button 
          onClick={onNewPatientClick}
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 order-first sm:order-none"
        >
          <UserPlusIcon />
          <span className="hidden xl:inline">New Patient / Task</span>
        </button>
        {isDoctorOrAdmin ? (
          <div className="flex items-center gap-2">
            <label htmlFor="branch-select" className="text-sm font-medium sr-only">Branch:</label>
            <select
              id="branch-select"
              value={selectedBranchId}
              onChange={(e) => onBranchChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        ) : <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-2 rounded-md">
            Branch: {branches.find(b => b.id === currentUser.branch_id)?.name}
        </div>}

        <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {currentUser.name.charAt(0)}
                </div>
                <span className="font-semibold hidden md:inline">{currentUser.name}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    {isDoctorOrAdmin && (
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('settings'); setMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <CogIcon /> Settings
                        </a>
                    )}
                    {isDoctorOrAdmin && (
                        <a href="#" onClick={(e) => { e.preventDefault(); onBlockTimeClick(); setMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <ClockIcon className="h-5 w-5" /> Block Time
                        </a>
                    )}
                    <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        <LogoutIcon /> Logout
                    </a>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};