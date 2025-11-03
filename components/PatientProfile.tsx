
import React from 'react';
import { Patient } from '../types';
import { UserIcon } from './icons';

interface PatientProfileProps {
  patient: Patient;
  onClose: () => void;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({ patient, onClose }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-slate-200 rounded-full overflow-hidden">
            {patient.photo_thumbnail_url ? (
              <img src={patient.photo_thumbnail_url} alt={patient.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-full h-full text-slate-500 p-4" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-slate-600">{patient.phone}</p>
            {patient.dob && <p className="text-sm text-slate-500">DOB: {patient.dob}</p>}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
      </div>

      <div>
        {/* Tab navigation will go here */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <a href="#" className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Overview
            </a>
            <a href="#" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Appointments
            </a>
            <a href="#" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Files
            </a>
            <a href="#" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Billing
            </a>
          </nav>
        </div>

        {/* Tab content will go here */}
        <div className="py-6">
          <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold text-md text-slate-700 mt-6 mb-2">Emergency Contact</h4>
                <p>{patient.emergency_contact?.name}</p>
                <p>{patient.emergency_contact?.phone}</p>
            </div>
            <div>
                <h4 className="font-semibold text-md text-slate-700 mt-6 mb-2">Insurance Details</h4>
                <p>{patient.insurance?.provider}</p>
                <p>{patient.insurance?.policy_number}</p>
            </div>
            <div>
                <h4 className="font-semibold text-md text-slate-700 mt-6 mb-2">Communication</h4>
                <p>{patient.preferred_communication}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
