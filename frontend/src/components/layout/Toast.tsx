import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const bgStyles = {
    success: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200',
    error: 'bg-rose-950/80 border-rose-500/40 text-rose-200',
    info: 'bg-blue-950/80 border-blue-500/40 text-blue-200',
  }[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all animate-bounce-in ${bgStyles}`}
    >
      {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
      {type === 'info' && <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-1 hover:opacity-75 transition-opacity ml-2">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
