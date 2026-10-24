import React from 'react';

interface NavbarProps {
  currentView: 'home' | 'farm' | 'health';
  onNavigate: (view: 'home' | 'farm' | 'health') => void;
  onOpenPreview: (type: 'farm' | 'health') => void;
  canInstall: boolean;
  onInstall: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenPreview,
  canInstall,
  onInstall
}) => {
  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-emerald-950 text-emerald-200 text-xs py-2 px-4 text-center border-b border-emerald-800/60 font-medium no-print">
        <span className="inline-flex items-center gap-1.5">
          <i className="fa-solid fa-seedling text-lime-400" />
          ระบบบันทึกข้อมูลดิจิทัลเพื่อการเรียนรู้และพัฒนาตนเอง ตามแนวทางปรัชญาเศรษฐกิจพอเพียง
        </span>
      </div>

      {/* Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-stone-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-lime-500 text-white flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition">
              <i className="fa-solid fa-leaf" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                Self-Reliance Platform
              </span>
              <h1 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                กสิกรรมไร้สารพิษ & สุขภาวะองค์รวม
              </h1>
            </div>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                currentView === 'home'
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-100'
              }`}
            >
              <i className="fa-solid fa-house sm:hidden" />
              <span className="hidden sm:inline">หน้าหลัก</span>
            </button>

            <button
              onClick={() => onNavigate('farm')}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
                currentView === 'farm'
                  ? 'bg-emerald-700 text-white font-bold shadow-sm'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-lime-50'
              }`}
            >
              <i className="fa-solid fa-wheat-awn text-lime-600" />
              <span>บัญชีฟาร์ม</span>
            </button>

            <button
              onClick={() => onNavigate('health')}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
                currentView === 'health'
                  ? 'bg-teal-700 text-white font-bold shadow-sm'
                  : 'text-stone-600 hover:text-teal-700 hover:bg-teal-50'
              }`}
            >
              <i className="fa-solid fa-heart-pulse text-rose-500" />
              <span>บัญชีสุขภาพ</span>
            </button>

            {canInstall && (
              <button
                onClick={onInstall}
                className="bg-lime-100 hover:bg-lime-200 text-emerald-900 px-3 py-1.5 rounded-xl font-semibold shadow-sm transition flex items-center gap-1.5"
                title="ติดตั้งแอปลงเครื่อง"
              >
                <i className="fa-solid fa-download text-xs" />
                <span className="hidden md:inline">ติดตั้งแอป</span>
              </button>
            )}

            {currentView === 'home' && (
              <button
                onClick={() => onOpenPreview('farm')}
                className="hidden lg:flex bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl font-semibold shadow-sm transition items-center gap-1.5"
              >
                <i className="fa-solid fa-play text-xs" />
                <span>พรีวิวระบบ</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
