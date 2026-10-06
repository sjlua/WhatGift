import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  DiscountTag01Icon,
  Link01Icon,
  SparklesIcon,
  Tick02Icon,
  GiftIcon,
} from '@hugeicons/core-free-icons';
import { sanitizeUrl } from '../utils/url';

const PRIORITIES = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
];

export default function ItemFormView({ itemToEdit, onSave, onCancel }) {
  const { themeId, isDark } = useTheme();

  // Festive Christmas & Birthday background ambient blurred circle accents
  const isChristmasTheme = themeId === 'christmas_duo' || themeId === 'christmas';
  const isBirthdayTheme = themeId === 'birthday';
  const festiveGlowColors = isChristmasTheme
    ? [isDark ? '#FF453A' : '#FF3B30', isDark ? '#30D158' : '#34C759']
    : isBirthdayTheme
    ? [isDark ? '#0A84FF' : '#007AFF', isDark ? '#FFD60A' : '#FFCC00']
    : null;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a gift title');
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setError('Please provide a valid approximate price (e.g. 29.99)');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        url: sanitizeUrl(url) || null,
        alt_url: sanitizeUrl(altUrl) || null,
        image_url: sanitizeUrl(imageUrl) || null,
        price: parseFloat(price),
        priority,
        is_on_sale: isOnSale,
      });
    } catch (err) {
      setError(err.message || 'Failed to save gift item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 animate-tab-fade pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight truncate">
            {itemToEdit ? `Edit "${itemToEdit.title}"` : 'Add New Gift'}
          </h1>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
            {itemToEdit ? 'Update details for this gift' : 'Add an item you would love to receive'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] rounded-lg transition border-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="item-page-form"
            disabled={submitting || isScraping}
            className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] rounded-lg transition border-0 disabled:opacity-50 shrink-0"
          >
            {submitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Publish Gift'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 text-sm rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]">
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
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#F0F2F5] dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] text-xs text-[#65676B] dark:text-[#B0B3B8]">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5 text-[var(--theme-primary)]" />
              <span className="leading-relaxed">
                <strong>Wishlist Coordination:</strong> Items you add remain visible to family members so they can coordinate claims secretly without spoiling the surprise for you.
              </span>
            </div>
          )}

          {/* 1. STORE LINK WITH SMART AUTO-FILL */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#F0F2F5] dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--theme-primary)] text-white flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={SparklesIcon} size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-sm text-[#050505] dark:text-[#E4E6EB]">
                      Store Link (URL)
                    </label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[var(--theme-primary)] text-white">
                      Auto-Fill
                    </span>
                  </div>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                    Paste a link from Amazon, JB Hi-Fi, Target, Kmart, etc. to auto-fill details
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
                disabled={isScraping}
                className="w-full h-11 pl-3.5 pr-24 rounded-lg bg-white dark:bg-[#3A3B3C] border border-[#CCD0D5] dark:border-[#4E4F50] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                {url.trim() && !isScraping && (
                  <button
                    type="button"
                    onClick={() => handleAutoFillFromUrl(url)}
                    className="px-3 py-1.5 rounded-md text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition flex items-center gap-1 border-0"
                  >
                    <HugeiconsIcon icon={SparklesIcon} size={13} />
                    <span>Auto-fill</span>
                  </button>
                )}
              </div>
            </div>

            {scrapeSuccess && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158] text-xs font-medium border border-[#34C759]/20">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Tick02Icon} size={15} />
                  <span>Details auto-filled from {scrapeSuccess.site_name}!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScrapeSuccess(null)}
                  className="text-xs font-bold px-1 text-[#65676B] dark:text-[#B0B3B8]"
                >
                  ✕
                </button>
              </div>
            )}

            {scrapeNotice && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FF9500]/10 text-[#A66200] dark:text-[#FFB340] text-xs font-medium">
                <span>{scrapeNotice}</span>
                <button
                  type="button"
                  onClick={() => setScrapeNotice('')}
                  className="text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* 2. CORE DETAILS: TITLE & PRICE */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] space-y-4">
            <h3 className="font-bold text-base text-[#050505] dark:text-[#E4E6EB]">
              Listing Information
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                Gift Title <span className="text-[#FF3B30]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="What is this item called?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                  Approximate Price ($) <span className="text-[#FF3B30]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#65676B] dark:text-[#B0B3B8]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-11 pl-8 pr-3.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] transition cursor-pointer"
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
              <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                Description / Sizes / Color Preferences
              </label>
              <textarea
                rows="3"
                placeholder="Specific size, color, specifications, or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] transition resize-y"
              />
            </div>
          </div>

          {/* 3. ADDITIONAL DETAILS */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-left border-0 bg-transparent"
            >
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB]">
                Optional Details (Sale, Image URL, Alt Link)
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-[#65676B] dark:text-[#B0B3B8] transition-transform duration-200 ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-[#E4E6EB] dark:border-[#3A3B3C]">
                {/* On sale toggle */}
                <label className="flex items-center gap-3 p-3 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isOnSale}
                    onChange={(e) => setIsOnSale(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-1.5">
                      <HugeiconsIcon icon={DiscountTag01Icon} size={15} className="text-[var(--theme-primary)]" />
                      Mark as On Sale
                    </span>
                    <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
                      Highlights this item with a sale tag in your wishlist
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://...image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(sanitizeUrl(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                    Alternative Store Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Target or secondary link"
                    value={altUrl}
                    onChange={(e) => setAltUrl(sanitizeUrl(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] transition"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Live Marketplace Preview Card */}
        <div className="lg:col-span-4 sticky top-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#65676B] dark:text-[#B0B3B8] px-1">
            Marketplace Preview
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] relative overflow-hidden">
            {/* Festive blurred background accent circles for Christmas & Birthday themes */}
            {festiveGlowColors && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl" aria-hidden="true">
                <div
                  className="absolute -top-10 -right-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full blur-2xl sm:blur-3xl transition-opacity duration-300 pointer-events-none"
                  style={{
                    backgroundColor: festiveGlowColors[0],
                    opacity: isDark ? 0.16 : 0.12,
                  }}
                />
                <div
                  className="absolute -bottom-10 -left-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full blur-2xl sm:blur-3xl transition-opacity duration-300 pointer-events-none"
                  style={{
                    backgroundColor: festiveGlowColors[1],
                    opacity: isDark ? 0.16 : 0.12,
                  }}
                />
              </div>
            )}
            <div className="relative z-[1]">
              <div className="w-full aspect-square bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg overflow-hidden flex items-center justify-center relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title || 'Preview'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-[#65676B] dark:text-[#B0B3B8] flex flex-col items-center gap-2">
                  <HugeiconsIcon icon={GiftIcon} size={44} />
                  <span className="text-xs">No image provided</span>
                </div>
              )}

              {isOnSale && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[var(--theme-primary)] text-white rounded">
                    <HugeiconsIcon icon={DiscountTag01Icon} size={11} />
                    Sale
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2.5 pb-1 space-y-0.5">
              <div className="text-[16px] font-bold text-[#050505] dark:text-[#E4E6EB]">
                {price && !isNaN(parseFloat(price))
                  ? parseFloat(price) === 0
                    ? 'FREE'
                    : `$${parseFloat(price).toFixed(2)}`
                  : '$0.00'}
              </div>
              <div className="text-[14px] text-[#050505] dark:text-[#E4E6EB] line-clamp-2">
                {title || 'Gift Title Preview'}
              </div>
              <div className="text-[12px] text-[#65676B] dark:text-[#B0B3B8]">
                {priority === 'high' ? 'High priority' : priority === 'low' ? 'Low priority' : 'Medium priority'}
              </div>
              {description && (
                <p className="text-[12px] text-[#65676B] dark:text-[#B0B3B8] line-clamp-2 pt-1 border-t border-[#E4E6EB] dark:border-[#3A3B3C] mt-1.5">
                  {description}
                </p>
              )}
            </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
