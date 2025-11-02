import React, { useEffect } from 'react';
import { Toast as ToastType } from '../types';
import { BellIcon, XCircleIcon } from './icons';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const baseClasses = 'flex items-center w-full max-w-xs p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow-lg';
  
  const typeClasses: Record<ToastType['type'], { icon: React.ReactNode, text: string }> = {
    success: { icon: <BellIcon className="w-5 h-5 text-green-500"/>, text: 'text-green-500' },
    error: { icon: <XCircleIcon className="w-5 h-5 text-red-500"/>, text: 'text-red-500' },
    info: { icon: <BellIcon className="w-5 h-5 text-blue-500"/>, text: 'text-blue-500' },
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`${baseClasses}`} role="alert">
      <div className={typeClasses[toast.type].text}>
        {typeClasses[toast.type].icon}
      </div>
      <div className="pl-4 text-sm font-normal text-slate-700">{toast.message}</div>
      <button onClick={() => onRemove(toast.id)} className="pl-4 text-slate-400 hover:text-slate-700">
        <XCircleIcon className="w-5 h-5"/>
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};