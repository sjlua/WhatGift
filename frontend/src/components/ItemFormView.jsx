import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useHaptics } from '../context/HapticsContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  DiscountTag01Icon,
  Link01Icon,
  LinkSquare01Icon,
  SparklesIcon,
  Tick02Icon,
  GiftIcon,
  Add01Icon,
  Delete02Icon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons';
import { sanitizeUrl, getDomain, handleImageFallbackError } from '../utils/url';
import ConfirmDialog from './ConfirmDialog';
import ExpandableDescription from './ExpandableDescription';

const PRIORITIES = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" },
];

export default function ItemFormView({
  itemToEdit,
  onSave,
  onCancel,
  onDelete,
  canDelete = true,
}) {
  const { triggerSuccess, triggerWarning } = useHaptics();

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

  // Image load state
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const previewStoreUrl = sanitizeUrl(url);
  const previewPriceValue = Number.parseFloat(price);
  const previewPrice = price && Number.isFinite(previewPriceValue)
    ? previewPriceValue === 0
      ? 'FREE'
      : `$${previewPriceValue % 1 === 0 ? previewPriceValue.toLocaleString() : previewPriceValue.toFixed(2)}`
    : null;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [imageUrl]);

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
  }, [itemToEdit]);

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
    <div className="w-full space-y-5 animate-tab-fade pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight">
            {itemToEdit ? `Edit "${itemToEdit.title}"` : 'Add New Gift'}
          </h1>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
            {itemToEdit
              ? 'Update the price, store links, notes, or priority of this gift'
              : 'Add an item to your wishlist with store links, photos, and approximate prices'}
          </p>
        </div>

        {/* Desktop Top Action Buttons: Hidden on mobile to prevent cropping title and caption */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-4 text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] rounded-xl transition border-0 active:scale-95"
          >
            Cancel
          </button>

          {itemToEdit && canDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(itemToEdit)}
              className="h-11 px-4 text-sm font-semibold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 rounded-xl transition border-0 active:scale-95 inline-flex items-center gap-1.5"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
              <span className="hidden sm:inline">Delete Gift</span>
            </button>
          )}

          <button
            type="submit"
            form="item-page-form"
            disabled={submitting || isScraping}
            className="h-11 px-5 text-sm font-bold text-white bg-[var(--theme-action)] hover:bg-[var(--theme-hover)] rounded-xl transition border-0 disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5 shadow-apple-sm active:scale-95"
          >
            {!itemToEdit && <HugeiconsIcon icon={Add01Icon} size={16} />}
            <span>{submitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Publish Item'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 text-sm rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] border-0 shadow-apple-xs">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Preview Right (on lg displays) */}
      <form id="item-page-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Input Fields */}
        <div className="lg:col-span-8 space-y-5">
          {/* Notice for new gifts */}
          {!itemToEdit && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F0F2F5] dark:bg-[#242526] border-0 shadow-apple-sm text-xs text-[#65676B] dark:text-[#B0B3B8]">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5 text-[var(--theme-primary)]" />
              <span className="leading-relaxed">
                <strong>Wishlist Coordination:</strong> Items you add remain visible to family members so they can coordinate claims secretly without spoiling the surprise for you.
              </span>
            </div>
          )}

          {/* 1. STORE LINK WITH SMART AUTO-FILL */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border-0 shadow-apple-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--theme-action)] text-white flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={SparklesIcon} size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-sm text-[#050505] dark:text-[#E4E6EB]">
                      Store Link (URL)
                    </label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--theme-tint)] text-[var(--theme-primary)] dark:bg-[var(--theme-tint-dark)]">
                      Auto-Fill
                    </span>
                  </div>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                    Paste a link from Amazon, JB Hi-Fi, Target, Kmart, or another retailer to auto-fill details
                  </p>
                </div>
              </div>
              {isScraping && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--theme-primary)] font-bold animate-pulse shrink-0">
                  <div className="w-3.5 h-3.5 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Fetching info...</span>
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="url"
                placeholder="https://www.amazon.com/dp/..."
                value={url}
                onChange={(e) => setUrl(sanitizeUrl(e.target.value))}
                onPaste={handleUrlPaste}
                onBlur={() => {
                  if (url && !title) handleAutoFillFromUrl(url);
                }}
                className="w-full h-11 pl-10 pr-28 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder:text-[#74767A] dark:placeholder:text-[#A4A6AA] placeholder:font-normal transition shadow-inner focus:outline-none"
              />
              <span className="absolute left-3 text-[#65676B] dark:text-[#B0B3B8]">
                <HugeiconsIcon icon={Link01Icon} size={18} />
              </span>
              <button
                type="button"
                onClick={() => handleAutoFillFromUrl(url)}
                disabled={isScraping || !url}
                className="absolute right-1.5 h-8 px-3 text-xs font-semibold text-white bg-[var(--theme-action)] hover:bg-[var(--theme-hover)] rounded-lg transition disabled:opacity-40 border-0 shadow-sm"
              >
                Auto-Fill
              </button>
            </div>

            {scrapeSuccess && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#34C759] pt-1">
                <HugeiconsIcon icon={Tick02Icon} size={15} />
                <span>
                  Auto-filled details from {scrapeSuccess.site_name}!
                </span>
              </div>
            )}
            {scrapeNotice && (
              <p className="text-xs text-[#FF9500] dark:text-[#FF9F0A] pt-1">
                {scrapeNotice}
              </p>
            )}
          </div>

          {/* 2. PRIMARY ITEM DETAILS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border-0 shadow-apple-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                Gift Title <span className="text-[#FF3B30]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sony WH-1000XM5 Headphones"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder:text-[#74767A] dark:placeholder:text-[#A4A6AA] placeholder:font-normal transition shadow-inner focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                  Price ($AUD) <span className="text-[#FF3B30]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#65676B] dark:text-[#B0B3B8]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="29.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[var(--theme-primary)] text-sm font-bold text-[#050505] dark:text-[#E4E6EB] placeholder:text-[#74767A] dark:placeholder:text-[#A4A6AA] placeholder:font-normal transition shadow-inner focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] transition shadow-inner focus:outline-none"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                Notes & Preferences (Size, Colour, Specs)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Size 38, black, wide fit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder:text-[#74767A] dark:placeholder:text-[#A4A6AA] placeholder:font-normal transition resize-none shadow-inner focus:outline-none"
              />
            </div>
          </div>

          {/* 3. OPTIONAL ADVANCED SETTINGS (Image, Sale, Alt URL) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border-0 shadow-apple-sm space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] border-0 bg-transparent p-0"
            >
              <span className="flex items-center gap-2">
                <span>Advanced Details (Photo, Alternative Link, Sale Highlight)</span>
                {imageUrl && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#34C759]" />
                )}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                className={`transition-transform duration-200 text-[#65676B] dark:text-[#B0B3B8] ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showAdvanced && (
              <div className="pt-2 space-y-4 border-t border-[#E4E6EB] dark:border-[#3A3B3C]">
                {/* On Sale Switch */}
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-action)] text-white flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={DiscountTag01Icon} size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] block">
                        Mark as "On Sale"
                      </span>
                      <span className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
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
                    <div className="w-11 h-6 bg-[#E4E6EB] dark:bg-[#4E4F50] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-action)]" />
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://...image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(sanitizeUrl(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder:text-[#74767A] dark:placeholder:text-[#A4A6AA] placeholder:font-normal transition shadow-inner focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                    Alternative Store Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Target or secondary link"
                    value={altUrl}
                    onChange={(e) => setAltUrl(sanitizeUrl(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder:text-[#74767A] dark:placeholder:text-[#A4A6AA] placeholder:font-normal transition shadow-inner focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Live Marketplace Preview Card */}
        <div className="lg:col-span-4 sticky top-6 space-y-3">
          <h3 className="text-[17px] font-semibold text-[#050505] dark:text-[#E4E6EB]">
            Item Preview
          </h3>

          <div className="group flex flex-col overflow-hidden rounded-[26px] bg-white p-2.5 shadow-apple-xs dark:bg-[#1C1C1E] sm:p-3">
            <div className="relative mb-3 aspect-square overflow-hidden rounded-[19px] bg-[#F0F2F5] dark:bg-[#3A3B3C]">
              {imageUrl && !imageLoadFailed ? (
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt={title || 'Preview'}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    handleImageFallbackError(e, imageUrl, () => setImageLoadFailed(true));
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#B0B3B8] dark:text-[#65676B]">
                  <HugeiconsIcon icon={GiftIcon} size={42} />
                </div>
              )}
              <span
                className={`absolute bottom-2 left-2 inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[10px] font-bold leading-tight shadow-sm sm:text-xs ${
                  priority === 'high'
                    ? 'bg-[#D92D20] text-white'
                    : priority === 'medium'
                    ? 'bg-[#F97316] text-[#1C1C1E]'
                    : 'bg-[#FDE047] text-[#1C1C1E]'
                }`}
              >
                {priority.toUpperCase()} PRIORITY
              </span>
            </div>

            <div className="flex flex-1 flex-col px-1">
              <h3 className="line-clamp-2 font-[var(--font-heading)] text-[16px] font-bold leading-[1.15] tracking-tight text-[#111111] dark:text-white sm:text-[20px]">
                {title || <span className="text-[#8E8E93]">Gift Title Preview</span>}
              </h3>

              <ExpandableDescription text={description} variant="card" />

              {previewStoreUrl && (
                <div className="mt-0 inline-flex min-h-11 max-w-full items-center gap-1.5 text-[13px] text-[#65676B] dark:text-[#B0B3B8]">
                  <HugeiconsIcon icon={LinkSquare01Icon} size={17} className="shrink-0" />
                  <span className="truncate underline decoration-1 underline-offset-2">
                    {getDomain(previewStoreUrl)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 overflow-hidden rounded-[20px] bg-[#151515] shadow-apple-sm dark:bg-white">
              <div className="flex min-h-[52px] items-center justify-center gap-2 px-2 text-center font-[var(--font-heading)] text-[18px] font-bold leading-tight text-white dark:text-[#1C1C1E] sm:text-[22px]">
                {isOnSale && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--theme-action)] px-2 py-1 font-sans text-[13px] font-bold text-white">
                    <HugeiconsIcon icon={DiscountTag01Icon} size={13} />
                    Sale!
                  </span>
                )}
                <span>
                  {previewPrice || <span className="font-sans text-sm font-normal text-[#B0B3B8] dark:text-[#8E8E93]">Price preview</span>}
                </span>
              </div>

              <div className="flex items-center">
                <div className={`${canDelete ? 'flex-1 rounded-tl-[17px] rounded-tr-none' : 'w-full rounded-t-[17px]'} inline-flex min-h-14 items-center justify-center gap-2 bg-[#E4E6EB] px-3 text-base font-semibold text-[#1C1C1E] dark:bg-[#3A3B3C] dark:text-white`}>
                  <HugeiconsIcon icon={PencilEdit02Icon} size={19} />
                  <span>Edit</span>
                </div>
                {canDelete && (
                  <div className="flex min-h-14 w-14 shrink-0 items-center justify-center rounded-tl-none rounded-tr-[17px] bg-[#E4E6EB] text-[#65676B] dark:bg-[#3A3B3C] dark:text-[#B0B3B8]">
                    <HugeiconsIcon icon={Delete02Icon} size={18} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Bottom Action: visible below preview when scrolling to the bottom of the page */}
          <div className="lg:hidden flex items-center justify-end gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-11 text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] rounded-xl transition border-0 text-center active:scale-95"
            >
              Cancel
            </button>
            {itemToEdit && canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(itemToEdit)}
                className="h-11 px-4 text-sm font-semibold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 rounded-xl transition border-0 active:scale-95 inline-flex items-center gap-1.5 shrink-0"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                <span>Delete</span>
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || isScraping}
              className="flex-1 h-11 text-sm font-bold text-white bg-[var(--theme-action)] hover:bg-[var(--theme-hover)] rounded-xl transition border-0 disabled:opacity-50 shadow-apple-sm inline-flex items-center justify-center gap-2 text-center active:scale-95"
            >
              {!itemToEdit && <HugeiconsIcon icon={Add01Icon} size={16} />}
              <span>{submitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Publish Item'}</span>
            </button>
          </div>
        </div>
      </form>

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
    </div>
  );
}
