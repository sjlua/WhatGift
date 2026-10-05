import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  icon,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade"
        onClick={() => !loading && onCancel()}
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-[#1C1C1E] p-6 shadow-2xl border-0 text-[#1C1C1E] dark:text-white animate-tab-fade"
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-apple-sm ${
              isDestructive
                ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
                : 'bg-[var(--theme-tint)] text-[var(--theme-primary)]'
            }`}
          >
            <HugeiconsIcon icon={icon || AlertCircleIcon} size={28} />
          </div>

          <h3 id="confirm-dialog-title" className="font-heading font-bold text-lg text-[#1C1C1E] dark:text-white mb-2 leading-snug">
            {title}
          </h3>

          <div className="text-xs sm:text-sm text-[#8E8E93] dark:text-[#A1A1A6] leading-relaxed mb-6">
            {message}
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] transition border-0 active:scale-95 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-apple-md transition border-0 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                isDestructive
                  ? 'bg-[#FF3B30] hover:bg-[#D70015]'
                  : 'bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
