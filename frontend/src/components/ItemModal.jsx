import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  LinkSquare01Icon,
  AlertCircleIcon,
  DiscountTag01Icon,
} from '@hugeicons/core-free-icons';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function ItemModal({ isOpen, onClose, onSave, itemToEdit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [altUrl, setAltUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isOnSale, setIsOnSale] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title || '');
      setDescription(itemToEdit.description || '');
      setUrl(itemToEdit.url || '');
      setAltUrl(itemToEdit.alt_url || '');
      setImageUrl(itemToEdit.image_url || '');
      setPrice(itemToEdit.price !== null && itemToEdit.price !== undefined ? String(itemToEdit.price) : '');
      setPriority(itemToEdit.priority || 'medium');
      setIsOnSale(Boolean(itemToEdit.is_on_sale));
    } else {
      setTitle('');
      setDescription('');
      setUrl('');
      setAltUrl('');
      setImageUrl('');
      setPrice('');
      setPriority('medium');
      setIsOnSale(false);
    }
    setError('');
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a gift title');
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setError('Please provide a valid approximate price (e.g. 29.99)');
      return;
    }

    if (!itemToEdit) {
      setShowAddConfirm(true);
      return;
    }

    executeSave();
  };

  const executeSave = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim() || null,
        alt_url: altUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        price: parseFloat(price),
        priority,
        is_on_sale: isOnSale,
      });
      setShowAddConfirm(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save gift item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={itemToEdit ? 'Edit Gift' : 'Add Gift'}
        accentHeader
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-[#FF3B30]/10 text-[#FF3B30]">
              <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cannot be removed notice when adding a new gift */}
          {!itemToEdit && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FF9500]/10 dark:bg-[#FF9500]/20 text-[#A66200] dark:text-[#FFB340] text-xs">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5 text-[#FF9500]" />
              <span className="leading-snug">
                <strong className="font-sans font-bold">Notice:</strong> Once you add a gift, it cannot be removed from your wishlist.
              </span>
            </div>
          )}

          {/* Gift Title - Required Badge */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5 flex items-center">
              <span>Gift Name</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF453A]/20 dark:text-[#FF453A] ml-1.5">
                Required
              </span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wireless Headphones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-base sm:text-[17px] text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
            />
          </div>

          {/* Price & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5 flex items-center">
                <span>Approx. Price ($)</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF453A]/20 dark:text-[#FF453A] ml-1.5">
                  Required
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 49.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-base sm:text-[17px] text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
              />
            </div>

            <div>
              <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-base sm:text-[17px] text-[#1C1C1E] dark:text-white focus:outline-none transition shadow-apple-sm"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value} className="bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sale Tickbox */}
          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] cursor-pointer select-none transition hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] group">
            <input
              type="checkbox"
              checked={isOnSale}
              onChange={(e) => setIsOnSale(e.target.checked)}
              className="w-5 h-5 rounded-md text-[var(--theme-primary)] focus:ring-[var(--theme-primary)] accent-[var(--theme-primary)] border-0 transition cursor-pointer"
            />
            <div className="flex-1 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-white flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={DiscountTag01Icon}
                    size={15}
                    className={isOnSale ? 'text-[var(--theme-primary)]' : 'text-[#8E8E93]'}
                  />
                  <span>On Sale</span>
                </span>
                <p className="text-[11px] text-[#8E8E93] leading-tight mt-0.5">
                  Highlight the price to let everyone know this gift is on sale.
                </p>
              </div>
              {isOnSale && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-primary)] text-white shadow-apple-sm shrink-0 font-sans">
                  Sale
                </span>
              )}
            </div>
          </label>

          {/* Primary Store URL */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5 flex items-center gap-1">
              <HugeiconsIcon icon={LinkSquare01Icon} size={14} />
              <span>Store Link (URL)</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-base sm:text-[17px] text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
            />
          </div>

          {/* Alternative Store or URL */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5 flex items-center gap-1">
              <HugeiconsIcon icon={LinkSquare01Icon} size={14} />
              <span>Alternative Store or Link (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Target, JB Hi-Fi, or https://..."
              value={altUrl}
              onChange={(e) => setAltUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-base sm:text-[17px] text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5">
              Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://...image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-base sm:text-[17px] text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5">
              Notes / Sizes / Colors
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Size M, navy blue or charcoal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-base sm:text-[17px] text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition resize-none shadow-apple-sm"
            />
          </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-sm transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Add Gift'}
          </button>
        </div>
      </form>
    </Modal>

    {/* Add Gift Confirmation Dialog */}
    <ConfirmDialog
      isOpen={showAddConfirm}
      title="Add to Wishlist?"
      message={`Add "${title}" ($${parseFloat(price || 0).toFixed(2)}) to your family wishlist?`}
      confirmText="Add Gift"
      cancelText="Cancel"
      isDestructive={false}
      loading={submitting}
      onConfirm={executeSave}
      onCancel={() => !submitting && setShowAddConfirm(false)}
    />
  </>
  );
}
