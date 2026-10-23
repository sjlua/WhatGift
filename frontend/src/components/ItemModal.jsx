import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../api/client';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  DiscountTag01Icon,
  Link01Icon,
  SparklesIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import { sanitizeUrl, handleImageFallbackError } from '../utils/url';
import ConfirmDialog from './ConfirmDialog';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function ItemModal({ isOpen, onClose, onSave, onDelete, canDelete = true, itemToEdit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [altUrl, setAltUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isOnSale, setIsOnSale] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Link understanding / prefill state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState(null);
  const [scrapeNotice, setScrapeNotice] = useState('');
  const [lastScrapedTitle, setLastScrapedTitle] = useState('');

  // Confirmation dialog for adding a new item
  const [showConfirmAddDialog, setShowConfirmAddDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

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
      setShowAdvanced(
        Boolean(itemToEdit.alt_url || itemToEdit.image_url || itemToEdit.is_on_sale || (itemToEdit.priority && itemToEdit.priority !== 'medium'))
      );
    } else {
      setTitle('');
      setDescription('');
      setUrl('');
      setAltUrl('');
      setImageUrl('');
      setPrice('');
      setPriority('medium');
      setIsOnSale(false);
      setShowAdvanced(false);
    }
    setError('');
    setIsScraping(false);
    setScrapeSuccess(null);
    setScrapeNotice('');
    setLastScrapedTitle('');
  }, [itemToEdit, isOpen]);

  const handleAutoFillFromUrl = async (targetUrl) => {
    let cleanUrl = sanitizeUrl(targetUrl || url);
    if (!cleanUrl) return;
    if (cleanUrl.startsWith('www.')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setScrapeNotice('Please enter a full URL starting with http:// or https://');
      return;
    }

    setIsScraping(true);
    setScrapeNotice('');
    setScrapeSuccess(null);

    try {
      const data = await api.scrapeLink(cleanUrl);
      let filledFields = [];

      if (data.title && (!title || title === lastScrapedTitle)) {
        setTitle(data.title);
        setLastScrapedTitle(data.title);
        filledFields.push('name');
      }
      if (data.price !== null && data.price !== undefined && (!price || parseFloat(price) === 0)) {
        setPrice(String(data.price));
        filledFields.push('price');
      }
      if (data.image_url) {
        setImageUrl(data.image_url);
        filledFields.push('image');
      }

      setScrapeSuccess({
        site_name: data.site_name || 'Retailer',
        count: filledFields.length,
      });
    } catch (err) {
      console.warn('Link scraping error:', err);
      setScrapeNotice('Could not auto-fill details from this link. You can enter them manually below.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleUrlPaste = (e) => {
    const text = e.clipboardData?.getData('text') || '';
    const clean = sanitizeUrl(text.trim());
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('www.')) {
      e.preventDefault();
      const finalUrl = clean.startsWith('www.') ? `https://${clean}` : clean;
      setUrl(finalUrl);
      setTimeout(() => handleAutoFillFromUrl(finalUrl), 80);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a gift title');
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setError('Please provide a valid price (e.g. 29.99)');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      url: sanitizeUrl(url) || null,
      alt_url: sanitizeUrl(altUrl) || null,
      image_url: sanitizeUrl(imageUrl) || null,
      price: parseFloat(price),
      priority,
      is_on_sale: isOnSale,
    };

    if (itemToEdit) {
      executeSave(payload);
    } else {
      setPendingPayload(payload);
      setShowConfirmAddDialog(true);
    }
  };

  const executeSave = async (payload) => {
    setSubmitting(true);
    setError('');
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save gift item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!pendingPayload) return;
    setShowConfirmAddDialog(false);
    await executeSave(pendingPayload);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={itemToEdit ? 'Edit Gift' : 'Add Gift'}
        accentHeader
        footer={
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div>
              {itemToEdit && canDelete && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(itemToEdit.id);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 transition active:scale-95 inline-flex items-center gap-1.5 border-0"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={15} />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="item-modal-form"
                onClick={handleSubmit}
                disabled={submitting || isScraping}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Publish Item'}
              </button>
            </div>
          </div>
        }
      >
        <form id="item-modal-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-[#FF3B30]/10 text-[#FF3B30]">
              <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Deletion notice when adding a new gift if disabled */}
          {!itemToEdit && !canDelete && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FF9500]/10 dark:bg-[#FF9500]/20 text-[#A66200] dark:text-[#FFB340] text-xs">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5 text-[#FF9500]" />
              <span className="leading-snug">
                <strong className="font-sans font-bold">Notice:</strong> Item deletion is currently turned off in your family settings.
              </span>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. TOP FIELD: Product Link (URL) with Smart Auto-Fill     */}
          {/* ======================================================== */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[var(--theme-tint)]/50 via-[#F8F8FA] to-[#F2F2F7] dark:from-[var(--theme-tint)]/25 dark:via-[#262628] dark:to-[#1E1E20] border-0 shadow-apple-card space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-apple-sm shrink-0">
                  <HugeiconsIcon icon={SparklesIcon} size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white">
                      Store Link (URL)
                    </label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[var(--theme-primary)] text-white shadow-apple-sm">
                      Do First
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] leading-tight mt-0.5">
                    Paste a link from Amazon, JB Hi-Fi, Target, etc. to auto-fill details
                  </p>
                </div>
              </div>
              {isScraping && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--theme-primary)] font-bold animate-pulse shrink-0">
                  <div className="w-3 h-3 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Detecting...</span>
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="url"
                placeholder="https://www.amazon.com/dp/... or paste link"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handleUrlPaste}
                className="w-full h-11 pl-10 pr-24 rounded-xl bg-white dark:bg-[#1C1C1E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
              />
              <div className="absolute left-3.5 text-[#8E8E93]">
                <HugeiconsIcon icon={Link01Icon} size={18} />
              </div>
              {url.trim() && (
                <button
                  type="button"
                  onClick={() => handleAutoFillFromUrl(url)}
                  disabled={isScraping}
                  className="absolute right-2 px-3 py-1.5 rounded-lg bg-[var(--theme-primary)] text-white font-sans font-bold text-xs hover:bg-[var(--theme-hover)] transition disabled:opacity-50"
                >
                  {isScraping ? 'Filling...' : 'Auto-fill'}
                </button>
              )}
            </div>

            {/* In-flight feedback shimmer banner */}
            {isScraping && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-sm text-xs text-[var(--theme-primary)] font-semibold shadow-apple-sm animate-pulse">
                <div className="w-4 h-4 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold">Understanding link & fetching product details...</div>
                  <div className="text-[11px] opacity-80 truncate">
                    Extracting Open Graph title, pricing, and high-res image
                  </div>
                </div>
              </div>
            )}

            {/* Scrape Success Feedback Badge */}
            {scrapeSuccess && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158] text-xs font-semibold border border-[#34C759]/25 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 truncate">
                  <HugeiconsIcon icon={SparklesIcon} size={15} className="shrink-0 text-[#34C759]" />
                  <span className="truncate">
                    Details auto-filled from <strong>{scrapeSuccess.site_name}</strong>!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setScrapeSuccess(null)}
                  className="text-[11px] font-bold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white px-1.5 py-0.5"
                  aria-label="Dismiss notice"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Scrape Notice Feedback (non-blocking fallback) */}
            {scrapeNotice && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FF9500]/10 text-[#A66200] dark:text-[#FFB340] text-xs font-medium">
                <span className="truncate">{scrapeNotice}</span>
                <button
                  type="button"
                  onClick={() => setScrapeNotice('')}
                  className="text-[10px] font-bold px-1.5 opacity-70 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Extracted Image Preview Card */}
            {imageUrl && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] shadow-apple-sm border-0 animate-in fade-in duration-150">
                <img
                  src={imageUrl}
                  alt="Product preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover bg-[#F2F2F7] dark:bg-[#2C2C2E] shrink-0"
                  onError={(e) => handleImageFallbackError(e, imageUrl)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#1C1C1E] dark:text-white truncate">
                    {title || 'Image Preview'}
                  </div>
                  <div className="text-[11px] text-[#8E8E93] truncate">
                    Photo extracted from product link
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 2. Gift Title / Name                                      */}
          {/* ======================================================== */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white mb-1.5">
              Gift Name <span className="text-[#FF3B30]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sony WH-1000XM5 Headphones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
              required
            />
          </div>

          {/* ======================================================== */}
          {/* 3. Price Field (AUD $)                                    */}
          {/* ======================================================== */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white mb-1.5">
              Approx. Price ($) <span className="text-[#FF3B30]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8E8E93]">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="29.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-11 pl-8 pr-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm font-bold text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
                required
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. Priority Segmented Control                             */}
          {/* ======================================================== */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E]">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-[#1C1C1E] text-[var(--theme-primary)] shadow-apple-sm font-bold'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 5. Notes / Sizes / Preferences */}
          {/* ======================================================== */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white mb-1.5">
              Notes & Preferences (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Size M, Navy Blue, or any alternative store links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition resize-none shadow-apple-sm"
            />
          </div>

          {/* ======================================================== */}
          {/* 6. ADVANCED ACCORDION (Sale, Alt Link, Image URL)        */}
          {/* ======================================================== */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left font-sans font-bold text-xs text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white py-2 transition"
            >
              <span className="flex items-center gap-1.5">
                <span>Advanced details (Photo, Alternative Link, Sale Highlight)</span>
                {imageUrl && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#34C759]" />
                )}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className="pt-3 space-y-3 animate-in fade-in duration-200">
                {/* On Sale Switch */}
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] transition">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={DiscountTag01Icon} size={16} className="text-[var(--theme-primary)]" />
                    <div>
                      <span className="font-sans font-bold text-xs text-[#1C1C1E] dark:text-white block">
                        Mark as "On Sale"
                      </span>
                      <span className="text-[11px] text-[#8E8E93] block">
                        Highlights item with a special badge for your family
                      </span>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isOnSale}
                      onChange={(e) => setIsOnSale(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#E5E5EA] dark:bg-[#38383A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-primary)]" />
                  </div>
                </label>

                {/* Alternative Store Link (Optional) */}
                <div>
                  <label className="block font-sans font-bold text-xs text-[#1C1C1E] dark:text-white mb-1.5">
                    Alternative Store Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Target, Kmart, or secondary retailer URL"
                    value={altUrl}
                    onChange={(e) => setAltUrl(sanitizeUrl(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
                  />
                </div>

                {/* Image URL (Optional) */}
                <div>
                  <label className="block font-sans font-bold text-xs text-[#1C1C1E] dark:text-white mb-1.5">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://...image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(sanitizeUrl(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog: Adding item */}
      <ConfirmDialog
        isOpen={showConfirmAddDialog}
        title="Add Gift to Wishlist"
        message={
          canDelete
            ? 'Add this gift to your wishlist for family members to view and coordinate claims?'
            : 'Adding an item to your wishlist cannot be deleted once added because item deletion is turned off in your family settings.'
        }
        confirmText="Add Gift"
        cancelText="Cancel"
        isDestructive={false}
        loading={submitting}
        onConfirm={handleConfirmAdd}
        onCancel={() => !submitting && setShowConfirmAddDialog(false)}
      />
    </>
  );
}
