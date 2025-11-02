import React from 'react';
import { User, Branch } from '../types';
import { UserPlusIcon } from './icons';

interface HeaderProps {
  currentUser: User;
  users: User[];
  onUserChange: (userId: number) => void;
  branches: Branch[];
  selectedBranchId: number | 'all';
  onBranchChange: (branchId: number | 'all') => void;
  isDoctor: boolean;
  onNewPatientClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onUserChange,
  branches,
  selectedBranchId,
  onBranchChange,
  isDoctor,
  onNewPatientClick
}) => {
  return (
    <header className="bg-white shadow-md p-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
      <div className="text-2xl font-bold text-slate-700">
        Dr. Prasanna's <span className="text-blue-600">CRM</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button 
          onClick={onNewPatientClick}
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 order-first sm:order-none"
        >
          <UserPlusIcon />
          New Patient / Task
        </button>
        <div className="flex items-center gap-2">
            <label htmlFor="user-select" className="text-sm font-medium">View As:</label>
            <select
                id="user-select"
                value={currentUser.id}
                onChange={(e) => onUserChange(Number(e.target.value))}
                className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                ))}
            </select>
        </div>
        {isDoctor && (
          <div className="flex items-center gap-2">
            <label htmlFor="branch-select" className="text-sm font-medium">Branch:</label>
            <select
              id="branch-select"
              value={selectedBranchId}
              onChange={(e) => onBranchChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={!isDoctor}
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        )}
         {!isDoctor && <div className="text-sm font-medium text-slate-600 bg-slate-200 px-3 py-2 rounded-md">
            Branch: {branches.find(b => b.id === currentUser.branch_id)?.name}
        </div>}
      </div>
    </header>
  );
};