import React from 'react';
import { FarmAccountView } from './FarmAccountView';
import { HealthAccountView } from './HealthAccountView';

interface PreviewModalProps {
  type: 'farm' | 'health' | null;
  onClose: () => void;
  onOpenFull: (type: 'farm' | 'health') => void;
  onShowToast: (msg: string, icon?: string) => void;
  onOpenImageModal: (url: string) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  type,
  onClose,
  onOpenFull,
  onShowToast,
  onOpenImageModal
}) => {
  if (!type) return null;

  const title = type === 'farm' ? 'แบบบันทึกบัญชีฟาร์ม' : 'สมุดบันทึกบัญชีสุขภาพ';

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm p-2 sm:p-6 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl mx-auto flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-stone-200 bg-stone-50 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Preview Mode
            </span>
            <h3 className="font-bold text-sm sm:text-base text-stone-900 truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenFull(type)}
              className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg transition"
            >
              เปิดเต็มหน้าจอ
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition"
              aria-label="ปิด"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full bg-white overflow-y-auto">
          {type === 'farm' ? (
            <FarmAccountView
              onShowToast={onShowToast}
              onOpenImageModal={onOpenImageModal}
              isModalPreview={true}
            />
          ) : (
            <HealthAccountView
              onShowToast={onShowToast}
              onOpenImageModal={onOpenImageModal}
              isModalPreview={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
