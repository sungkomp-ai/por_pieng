import React, { useState, useEffect } from 'react';

interface PwaBannerProps {
  onInstall: () => void;
  canInstall: boolean;
}

export const PwaBanner: React.FC<PwaBannerProps> = ({ onInstall, canInstall }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker update detection
    if ('serviceWorker' in navigator) {
      let hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) {
          setHasUpdate(true);
        }
        hadController = true;
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <aside
      aria-label="PWA Status and Actions"
      className="fixed left-3 bottom-3 z-40 flex flex-col gap-2 items-start font-sans pointer-events-auto no-print"
    >
      {hasUpdate && (
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 border-0 rounded-full px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 shadow-lg cursor-pointer transition"
        >
          <span>🔄</span> <span>มีเวอร์ชันใหม่ — แตะเพื่อโหลดใหม่</span>
        </button>
      )}

      {isOffline && (
        <div className="inline-flex items-center gap-2 border-0 rounded-full px-3.5 py-2 text-xs font-semibold text-white bg-slate-600 shadow-lg">
          <span>📴</span> <span>ออฟไลน์ — ข้อมูลยังบันทึกในเครื่องได้</span>
        </div>
      )}

      {canInstall && (
        <button
          onClick={onInstall}
          className="inline-flex items-center gap-2 border-0 rounded-full px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 shadow-lg cursor-pointer transition"
        >
          <span>⬇️</span> <span>ติดตั้งแอป</span>
        </button>
      )}
    </aside>
  );
};
