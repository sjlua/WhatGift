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
import { sanitizeUrl, handleImageFallbackError } from '../utils/url';
import ConfirmDialog from './ConfirmDialog';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function ItemModal({ isOpen, onClose, onSave, itemToEdit, canDelete = true }) {
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

    setError('');

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
        title={itemToEdit ? 'Edit Gift Wish' : 'Add Gift to Wishlist'}
        subtitle={
          itemToEdit
            ? 'Update the price, store links, notes, or priority of this gift'
            : 'Add an item to your wishlist with store links, photos, and approximate prices'
        }
        primaryAction={{
          label: submitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Add to Wishlist',
          onClick: handleSubmit,
          disabled: submitting || isScraping,
          loading: submitting,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: onClose,
          disabled: submitting,
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs sm:text-sm rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. SMART STORE LINK AUTO-FILL */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-xs sm:text-sm text-[#1C1C1E] dark:text-white flex items-center gap-1.5">
                <HugeiconsIcon icon={SparklesIcon} size={15} className="text-[var(--theme-primary)]" />
                <span>Smart Auto-Fill from Store Link</span>
              </label>
              {isScraping && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-primary)] font-bold animate-pulse">
                  <div className="w-3 h-3 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                  <span>Fetching...</span>
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="url"
                placeholder="Paste link from Amazon, Target, JB Hi-Fi..."
                value={url}
                onChange={(e) => setUrl(sanitizeUrl(e.target.value))}
                onPaste={handleUrlPaste}
                onBlur={() => {
                  if (url && !title) handleAutoFillFromUrl(url);
                }}
                className="w-full h-11 pl-9 pr-24 rounded-xl bg-white dark:bg-[#38383A] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
              />
              <span className="absolute left-3 text-[#8E8E93]">
                <HugeiconsIcon icon={Link01Icon} size={16} />
              </span>
              <button
                type="button"
                onClick={() => handleAutoFillFromUrl(url)}
                disabled={isScraping || !url}
                className="absolute right-1.5 h-8 px-3 rounded-lg bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] text-white text-xs font-semibold transition disabled:opacity-40 border-0 shadow-sm"
              >
                Auto-Fill
              </button>
            </div>

            {scrapeSuccess && (
              <p className="text-[11px] text-[#34C759] font-semibold">
                ✓ Auto-filled {scrapeSuccess.count} details from {scrapeSuccess.site_name}!
              </p>
            )}
            {scrapeNotice && (
              <p className="text-[11px] text-[#FF9500] dark:text-[#FF9F0A]">
                {scrapeNotice}
              </p>
            )}

            {/* Detected Image Thumbnail */}
            {imageUrl && (
              <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-[#38383A] rounded-xl shadow-apple-sm">
                <img
                  src={imageUrl}
                  alt="Detected product"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-contain bg-[#F2F2F7] dark:bg-[#2C2C2E] p-1 shrink-0 border-0"
                  onError={(e) => {
                    handleImageFallbackError(e, imageUrl);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-[#1C1C1E] dark:text-white block truncate">
                    Product Image Detected
                  </span>
                  <span className="text-[11px] text-[#8E8E93] truncate block font-mono">
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

          {/* 2. Gift Name (Required) */}
          <div>
            <label className="block text-sm font-semibold text-[#1C1C1E] dark:text-white mb-1.5">
              Gift Name <span className="text-[#FF3B30]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sony WH-1000XM5 Noise Canceling Headphones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
              required
            />
          </div>

          {/* 3. Price (Required) */}
          <div>
            <label className="block text-sm font-semibold text-[#1C1C1E] dark:text-white mb-1.5">
              Price ($) <span className="text-[#FF3B30]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8E8E93]">
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
            <p className="text-[11px] text-[#8E8E93] mt-1 pl-1">
              Used for approximate budget estimation by family members. Enter 0 for free/DIY wishes.
            </p>
          </div>

          {/* 4. Priority Level Segmented Control */}
          <div>
            <label className="block text-sm font-semibold text-[#1C1C1E] dark:text-white mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`h-9 text-xs font-semibold rounded-lg transition-all ${
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

          {/* 5. Notes / Sizes / Preferences */}
          <div>
            <label className="block text-sm font-semibold text-[#1C1C1E] dark:text-white mb-1.5">
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

          {/* 6. ADVANCED ACCORDION (Sale, Alt Link, Image URL) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white py-2 transition"
            >
              <span>Advanced Options (On Sale, Alternative Store Link, Photo)</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className="pt-3 pb-1 space-y-3 animate-in fade-in duration-200 border-t border-[#E5E5EA] dark:border-[#2C2C2E] mt-1">
                {/* On Sale Switch */}
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-white dark:bg-[#38383A] transition">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={DiscountTag01Icon} size={16} className="text-[var(--theme-primary)]" />
                    <div>
                      <span className="font-semibold text-xs text-[#1C1C1E] dark:text-white block">
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
                    <div className="w-11 h-6 bg-[#E5E5EA] dark:bg-[#2C2C2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-primary)]" />
                  </div>
                </label>

                {/* Alternative URL (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1E] dark:text-white mb-1.5">
                    Alternative Store Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Target, JB Hi-Fi, or secondary link"
                    value={altUrl}
                    onChange={(e) => setAltUrl(sanitizeUrl(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] focus:outline-none transition shadow-apple-sm"
                  />
                </div>

                {/* Image URL (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1E] dark:text-white mb-1.5">
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
