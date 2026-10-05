import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useHaptics } from '../context/HapticsContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Tick02Icon,
  LockKeyIcon,
  Delete02Icon,
  AlertCircleIcon,
  ShoppingBag01Icon,
} from '@hugeicons/core-free-icons';

export default function ClaimModal({
  isOpen,
  onClose,
  item,
  onSaveClaim,
  onReleaseClaim,
}) {
  const { user } = useAuth();
  const { triggerSelection, triggerSuccess, triggerWarning } = useHaptics();

  const [status, setStatus] = useState('want_to_buy');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);

  const isExistingClaim = item?.claim?.is_claimed_by_viewer;

  useEffect(() => {
    if (item?.claim) {
      const raw = item.claim.status;
      setStatus(raw === 'bought' || raw === 'purchased' ? 'bought' : 'want_to_buy');
      setNotes(item.claim.notes || '');
    } else {
      setStatus('want_to_buy');
      setNotes('');
    }
    setError('');
  }, [item, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item) return;

    setSubmitting(true);
    setError('');
    try {
      await onSaveClaim(item.id, {
        status,
        notes: notes.trim() || null,
      });
      triggerSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update gift status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = () => {
    triggerWarning();
    setShowReleaseConfirm(true);
  };

  const handleConfirmRelease = async () => {
    if (!item) return;
    setSubmitting(true);
    try {
      await onReleaseClaim(item.id);
      triggerWarning();
      setShowReleaseConfirm(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to release mark');
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExistingClaim ? 'Update Gift Status' : `Mark "${item.title}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-[#FF3B30]/10 text-[#FF3B30]">
            <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Secret Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs text-[#636366] dark:text-[#E5E5EA]">
          <HugeiconsIcon icon={LockKeyIcon} size={16} className="shrink-0 text-[#8E8E93] mt-0.5" />
          <span>
            <strong>Top Secret:</strong> Status is hidden from the recipient. They cannot see who marked this gift or any secret notes.
          </span>
        </div>

        {/* Purchaser Identity Preview */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#2C2C2E] border-0 shadow-apple-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{user?.avatar || '🎁'}</span>
            <div>
              <div className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                Visible to family as
              </div>
              <div className="text-[11px] text-[#8E8E93]">
                Your emoji and name will appear on this gift
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)] text-xs font-bold shadow-apple-sm">
            <span>{user?.avatar || '🎁'}</span>
            <span>{user?.alias}</span>
          </span>
        </div>

        {/* Choice: BOUGHT or WANT TO BUY */}
        <div>
          <label className="block font-sans font-bold text-xs text-[#8E8E93] dark:text-[#A1A1A6] mb-2">
            Choose Status
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* WANT TO BUY */}
            <button
              type="button"
              onClick={() => {
                setStatus('want_to_buy');
                triggerSelection();
              }}
              className={`p-3.5 rounded-2xl text-left transition-all border-0 flex flex-col justify-between ${
                status === 'want_to_buy'
                  ? 'bg-[#FF9500]/15 dark:bg-[#FF9500]/20 shadow-apple-sm ring-2 ring-[#FF9500] text-[#B25900] dark:text-[#FF9F0A]'
                  : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] text-[#1C1C1E] dark:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1C1C1E] flex items-center justify-center text-[#FF9500] shadow-apple-sm">
                  <HugeiconsIcon icon={ShoppingBag01Icon} size={18} />
                </div>
                {status === 'want_to_buy' && (
                  <span className="text-[10px] font-bold bg-[#FF9500] text-white px-2 py-0.5 rounded-full shadow-apple-sm font-sans">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold font-sans">
                  Want to Buy
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                  Reserving to buy soon
                </div>
              </div>
            </button>

            {/* BOUGHT */}
            <button
              type="button"
              onClick={() => {
                setStatus('bought');
                triggerSelection();
              }}
              className={`p-3.5 rounded-2xl text-left transition-all border-0 flex flex-col justify-between ${
                status === 'bought'
                  ? 'bg-[#34C759]/15 dark:bg-[#34C759]/20 shadow-apple-sm ring-2 ring-[#34C759] text-[#1B8036] dark:text-[#30D158]'
                  : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] text-[#1C1C1E] dark:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1C1C1E] flex items-center justify-center text-[#34C759] shadow-apple-sm">
                  <HugeiconsIcon icon={Tick02Icon} size={18} />
                </div>
                {status === 'bought' && (
                  <span className="text-[10px] font-bold bg-[#34C759] text-white px-2 py-0.5 rounded-full shadow-apple-sm font-sans">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold font-sans">
                  Bought
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                  Already ordered / bought
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Secret Notes */}
        <div>
          <label className="block font-sans font-bold text-xs text-[#8E8E93] dark:text-[#A1A1A6] mb-1">
            Secret Note (Visible to other family buyers)
          </label>
          <textarea
            rows="2"
            placeholder="e.g. Bought size M on Amazon, arriving Friday"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-[15px] text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition resize-none shadow-apple-sm"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
          {isExistingClaim ? (
            <button
              type="button"
              onClick={handleRelease}
              disabled={submitting}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 px-3 py-1.5 rounded-xl transition"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} /> Release Mark
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isExistingClaim ? 'Update Status' : 'Confirm Choice'}
            </button>
          </div>
        </div>
      </form>
    </Modal>

    {/* Release Gift Confirmation Dialog */}
    <ConfirmDialog
      isOpen={showReleaseConfirm}
      title="Release This Gift?"
      message="Are you sure you want to release this gift? Other family members will be able to claim or purchase it."
      confirmText="Release Gift"
      cancelText="Cancel"
      isDestructive={true}
      loading={submitting}
      onConfirm={handleConfirmRelease}
      onCancel={() => !submitting && setShowReleaseConfirm(false)}
    />
  </>
  );
}
