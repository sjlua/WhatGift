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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Link understanding / prefill state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState(null);
  const [scrapeNotice, setScrapeNotice] = useState('');
  const [lastScrapedTitle, setLastScrapedTitle] = useState('');

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
    const cleanUrl = (targetUrl || url).trim();
    if (!cleanUrl) return;
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
    const clean = text.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      setUrl(clean);
      setTimeout(() => handleAutoFillFromUrl(clean), 80);
    }
  };

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
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save gift item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
        onClose={onClose}
        title={itemToEdit ? 'Edit Gift' : 'Add Gift'}
        accentHeader
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
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
              {submitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Add Gift'}
            </button>
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

          {/* Cannot be removed notice when adding a new gift */}
          {!itemToEdit && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FF9500]/10 dark:bg-[#FF9500]/20 text-[#A66200] dark:text-[#FFB340] text-xs">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5 text-[#FF9500]" />
              <span className="leading-snug">
                <strong className="font-sans font-bold">Notice:</strong> Once you add a gift, it cannot be removed from your wishlist.
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
                placeholder="Paste link (Amazon, JB Hi-Fi, Target, Kmart...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handleUrlPaste}
                disabled={isScraping}
                className={`w-full h-12 pl-4 pr-24 rounded-xl bg-white dark:bg-[#1C1C1E] border-0 text-sm sm:text-base text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm ${
                  isScraping
                    ? 'ring-2 ring-[var(--theme-primary)] bg-[var(--theme-tint)]/40 animate-pulse'
                    : 'focus:ring-2 focus:ring-[var(--theme-primary)]'
                }`}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {url.trim() && !isScraping && (
                  <button
                    type="button"
                    onClick={() => handleAutoFillFromUrl(url)}
                    title="Auto-fill product details from webpage metadata"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-sm transition active:scale-95 flex items-center gap-1"
                  >
                    <HugeiconsIcon icon={SparklesIcon} size={13} />
                    <span>Auto-fill</span>
                  </button>
                )}
              </div>
            </div>

            {/* Link Understanding Active Loading Status */}
            {isScraping && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--theme-tint)] text-[var(--theme-primary)] text-xs font-semibold animate-pulse border border-[var(--theme-primary)]/20">
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
                  className="w-12 h-12 rounded-lg object-contain bg-[#F2F2F7] dark:bg-[#2C2C2E] p-1 shrink-0 border-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-[#1C1C1E] dark:text-white block truncate">
                    Product Image Detected
                  </span>
                  <span className="text-[10px] text-[#8E8E93] truncate block font-mono">
                    {imageUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="p-1 rounded-lg text-[#8E8E93] hover:text-[#FF3B30] text-xs font-bold transition"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* Divider: Separating Step 1 Auto-Fill from Manual Fields  */}
          {/* ======================================================== */}
          <div className="relative py-1.5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5EA] dark:border-[#2C2C2E]" />
            </div>
            <div className="relative bg-white dark:bg-[#1C1C1E] px-3 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider font-sans">
              Gift Details
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. Gift Name (Required) */}
          {/* ======================================================== */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white mb-1.5 flex items-center">
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
              className="w-full h-12 px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm sm:text-base text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
            />
          </div>

          {/* ======================================================== */}
          {/* 3. Approx. Price (Required) */}
          {/* ======================================================== */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white mb-1.5 flex items-center">
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
              className="w-full h-12 px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm sm:text-base text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
            />
          </div>

          {/* ======================================================== */}
          {/* 4. Notes / Sizes / Colors */}
          {/* ======================================================== */}
          <div>
            <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white mb-1.5">
              Notes / Sizes / Colors (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Size M, navy blue or charcoal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition resize-none shadow-apple-sm"
            />
          </div>

          {/* ======================================================== */}
          {/* 5. Progressive Disclosure: Additional Options           */}
          {/* ======================================================== */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] text-xs font-bold text-[#636366] dark:text-[#A1A1A6] transition group"
            >
              <div className="flex items-center gap-2">
                <span>{showAdvanced ? 'Hide additional options' : 'More options (Priority, Sale, Alt link, Image)'}</span>
                {!showAdvanced && (isOnSale || altUrl || imageUrl || priority !== 'medium') && (
                  <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)]" />
                )}
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className="space-y-3.5 pt-3 animate-in fade-in duration-150">
                {/* Priority */}
                <div>
                  <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#1C1C1E] dark:text-white mb-1.5">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white focus:outline-none transition shadow-apple-sm cursor-pointer appearance-none"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value} className="bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white">
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]">
                      <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                    </div>
                  </div>
                </div>

                {/* Sale Checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] cursor-pointer select-none transition hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] group">
                  <input
                    type="checkbox"
                    checked={isOnSale}
                    onChange={(e) => setIsOnSale(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--theme-primary)] focus:ring-[var(--theme-primary)] accent-[var(--theme-primary)] border-0 transition cursor-pointer"
                  />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-[#1C1C1E] dark:text-white flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={DiscountTag01Icon}
                          size={14}
                          className={isOnSale ? 'text-[var(--theme-primary)]' : 'text-[#8E8E93]'}
                        />
                        <span>On Sale</span>
                      </span>
                      <p className="text-[11px] text-[#8E8E93] leading-tight">
                        Highlight price to let everyone know this gift is on sale.
                      </p>
                    </div>
                    {isOnSale && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-primary)] text-white shadow-apple-sm shrink-0 font-sans">
                        Sale
                      </span>
                    )}
                  </div>
                </label>

                {/* Alternative Store Link */}
                <div>
                  <label className="block font-sans font-bold text-xs text-[#1C1C1E] dark:text-white mb-1.5">
                    Alternative Store or Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Target, JB Hi-Fi, or https://..."
                    value={altUrl}
                    onChange={(e) => setAltUrl(e.target.value)}
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
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>
  );
}
