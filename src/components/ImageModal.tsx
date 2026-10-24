import React from 'react';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative bg-white p-2 rounded-2xl max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-stone-800/80 hover:bg-stone-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 transition"
          aria-label="ปิด"
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <img
          src={imageUrl}
          alt="รูปภาพขยาย"
          className="max-w-full max-h-[80vh] object-contain rounded-xl"
        />
      </div>
    </div>
  );
};
