import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  maxWidth = 'max-w-md',
  accentHeader = false,
}) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] overflow-hidden"
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
        className={`relative z-10 w-full ${maxWidth} max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col rounded-3xl bg-white dark:bg-[#1C1C1E] p-0 shadow-2xl overflow-hidden text-[#1C1C1E] dark:text-white border-0 animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b shrink-0 transition-colors duration-200 ${
            accentHeader
              ? 'text-white border-transparent'
              : 'border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F9F9FB] dark:bg-[#242426]'
          }`}
          style={
            accentHeader
              ? { background: 'var(--theme-navbar-bg, var(--theme-primary))' }
              : undefined
          }
        >
          <h3
            id="modal-title"
            className={`text-base sm:text-lg font-heading font-black tracking-tight ${
              accentHeader ? 'text-white drop-shadow-sm' : 'text-[#1C1C1E] dark:text-white'
            }`}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-1.5 transition active:scale-95 ${
              accentHeader
                ? 'text-white/80 hover:text-white hover:bg-white/20'
                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#38383A]'
            }`}
            aria-label="Close dialog"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Anchored Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
