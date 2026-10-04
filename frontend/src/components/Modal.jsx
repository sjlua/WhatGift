import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  // Lock body scroll and listen for Escape key when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Stable Full-Screen Dim Backdrop - Click to Close */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full ${maxWidth} rounded-3xl bg-white dark:bg-[#1C1C1E] p-0 shadow-2xl overflow-hidden text-[#1C1C1E] dark:text-white border-0 animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] px-5 py-4 bg-[#F9F9FB] dark:bg-[#242426]">
          <h3 id="modal-title" className="text-base font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] transition"
            aria-label="Close dialog"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[82vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
