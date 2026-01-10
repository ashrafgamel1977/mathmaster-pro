
import React, { useEffect } from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-indigo-500'
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  return (
    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white transform transition-all duration-300 animate-slideUp ${bgColors[type]}`}>
      <span className="text-xl">{icons[type]}</span>
      <p className="font-bold text-sm leading-relaxed">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="mr-4 text-white/70 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: Omit<ToastProps, 'onClose'>[], onClose: (id: string) => void }> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

export default Toast;
