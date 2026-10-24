import React from 'react';

interface ToastProps {
  show: boolean;
  message: string;
  icon?: string;
}

export const Toast: React.FC<ToastProps> = ({ show, message, icon }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 text-xs sm:text-sm animate-bounce">
      <i className={icon || 'fa-solid fa-circle-check text-emerald-400 text-lg'} />
      <span>{message}</span>
    </div>
  );
};
