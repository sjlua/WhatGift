import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHaptics } from '../context/HapticsContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  LinkSquare01Icon,
  PencilEdit02Icon,
  Tick02Icon,
  ShoppingBag01Icon,
  Cancel01Icon,
  DiscountTag01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import { sanitizeUrl, getDomain, handleImageFallbackError } from '../utils/url';
import ExpandableDescription from './ExpandableDescription';

const PRIORITY_BADGES = {
  high: {
    label: 'HIGH',
    className: 'bg-[#D92D20] text-white',
  },
  medium: {
    label: 'MEDIUM',
    className: 'bg-[#F97316] text-[#1C1C1E]',
  },
  low: {
    label: 'LOW',
    className: 'bg-[#FDE047] text-[#1C1C1E]',
  },
};

export default function WishlistCard({
  item,
  onEdit,
  onDelete,
  canDelete = true,
  onClaim,
  onEditClaim,
  onReleaseClaim,
  onQuickMark,
}) {
  const { triggerLight, triggerWarning } = useHaptics();
  const [showLightbox, setShowLightbox] = useState(false);

  const isOwner = item.is_owner;
  const claim = item.claim;

  const isBought = claim?.status === 'bought' || claim?.status === 'purchased';
  const priorityBadge = PRIORITY_BADGES[item.priority?.toLowerCase()] ?? PRIORITY_BADGES.medium;

  const cleanUrl = sanitizeUrl(item.url);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!showLightbox) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLightbox(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox]);

  const handleOpenLightbox = (e) => {
    e.stopPropagation();
    triggerLight();
    setShowLightbox(true);
  };

  const handleClaimClick = () => {
    triggerLight();
    onClaim(item);
  };

  const handleEditClaimClick = () => {
    triggerLight();
    onEditClaim(item);
  };

  // Format price display — FB Marketplace style
  const formatPrice = (price) => {
    if (price === null || price === undefined) return null;
    const num = Number(price);
    if (num === 0) return 'FREE';
    return `$${num % 1 === 0 ? num.toLocaleString() : num.toFixed(2)}`;
  };

  const priceDisplay = formatPrice(item.price);

  return (
    <>
      <div className="group flex h-full flex-col overflow-hidden rounded-[26px] bg-white p-2.5 shadow-apple-xs transition-shadow duration-150 hover:shadow-apple-sm dark:bg-[#1C1C1E] sm:p-3">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-[19px] bg-[#F0F2F5] dark:bg-[#3A3B3C]">
          {item.image_url ? (
            <button
              type="button"
              onClick={handleOpenLightbox}
              aria-label={`View larger image of ${item.title}`}
              className="absolute inset-0 h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
            >
              <img
                src={item.image_url}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                onError={(e) => {
                  handleImageFallbackError(e, item.image_url);
                }}
              />
            </button>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#B0B3B8] dark:text-[#65676B]">
              <HugeiconsIcon icon={GiftIcon} size={42} />
            </div>
          )}

          <span className={`absolute bottom-2 left-2 inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[10px] font-bold leading-tight shadow-sm sm:text-xs ${priorityBadge.className}`}>
            {priorityBadge.label} PRIORITY
          </span>

          {!isOwner && claim && (
            <span
              className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-[#1C1C1E] shadow-sm sm:text-xs ${
                isBought ? 'bg-[#91D66D]' : 'bg-[#F4B400]'
              }`}
            >
              <HugeiconsIcon icon={isBought ? Tick02Icon : ShoppingBag01Icon} size={13} />
              {isBought ? 'PURCHASED' : 'CLAIMED'}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-1">
          <h3 className="line-clamp-2 font-[var(--font-heading)] text-[16px] font-bold leading-[1.15] tracking-tight text-[#111111] dark:text-white sm:text-[20px]">
            {item.title}
          </h3>

          <ExpandableDescription text={item.description} variant="card" />

          {cleanUrl && (
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0 inline-flex min-h-11 max-w-full items-center gap-1.5 text-[13px] text-[#65676B] underline decoration-1 underline-offset-2 hover:text-[#1C1C1E] dark:text-[#B0B3B8] dark:hover:text-white"
              aria-label={`Open product link at ${getDomain(cleanUrl)}`}
            >
              <HugeiconsIcon icon={LinkSquare01Icon} size={17} className="shrink-0" />
              <span className="truncate">{getDomain(cleanUrl)}</span>
            </a>
          )}

          {!isOwner && claim?.is_claimed_by_viewer && claim?.notes && (
            <div className="mt-1 whitespace-pre-wrap break-words text-[11px] italic text-[#8E8E93] dark:text-[#A1A1A6]">
              Note: {claim.notes}
            </div>
          )}
        </div>

        <div className="mt-3 overflow-hidden rounded-[20px] bg-[#151515] shadow-apple-sm dark:bg-white">
          <div className="flex min-h-[52px] items-center justify-center gap-2 px-2 text-center font-[var(--font-heading)] text-[18px] font-bold leading-tight text-white dark:text-[#1C1C1E] sm:text-[22px]">
            {item.is_on_sale && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--theme-action)] px-2 py-1 font-sans text-[13px] font-bold text-white">
                <HugeiconsIcon icon={DiscountTag01Icon} size={13} />
                Sale!
              </span>
            )}
            <span>{priceDisplay || 'Price not set'}</span>
          </div>

          {isOwner ? (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  triggerLight();
                  onEdit(item);
                }}
                className={`${canDelete && onDelete ? 'flex-1 rounded-tl-[17px] rounded-tr-none' : 'w-full rounded-t-[17px]'} inline-flex min-h-14 items-center justify-center gap-2 bg-[#E4E6EB] px-3 text-base font-semibold text-[#1C1C1E] transition hover:bg-[#D8DADF] active:scale-[0.98] dark:bg-[#3A3B3C] dark:text-white dark:hover:bg-[#4E4F50]`}
              >
                <HugeiconsIcon icon={PencilEdit02Icon} size={19} />
                <span>Edit</span>
              </button>

              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerWarning?.();
                    onDelete(item);
                  }}
                  className="flex min-h-14 w-14 shrink-0 items-center justify-center rounded-tl-none rounded-tr-[17px] bg-[#E4E6EB] text-[#65676B] transition hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] active:scale-[0.98] dark:bg-[#3A3B3C] dark:text-[#B0B3B8] dark:hover:bg-[#FF453A]/15 dark:hover:text-[#FF453A]"
                  title="Delete gift from wishlist"
                  aria-label="Delete gift from wishlist"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={18} />
                </button>
              )}
            </div>
          ) : claim?.is_claimed_by_viewer ? (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onQuickMark?.(item)}
                className={`inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-tl-[17px] rounded-tr-none px-2 text-base font-bold transition active:scale-[0.98] ${
                  isBought
                    ? 'bg-[#91D66D] text-[#1C1C1E] hover:bg-[#82CA5B]'
                    : 'bg-[#F4B400] text-[#1C1C1E] hover:bg-[#E5A900]'
                }`}
              >
                <HugeiconsIcon icon={isBought ? Tick02Icon : ShoppingBag01Icon} size={19} />
                <span>{isBought ? 'Bought' : 'Mark Bought'}</span>
              </button>
              <button
                type="button"
                onClick={handleEditClaimClick}
                className="min-h-14 rounded-tl-none rounded-tr-[17px] bg-[#E4E6EB] px-3 text-base font-semibold text-[#1C1C1E] transition hover:bg-[#D8DADF] active:scale-[0.98] dark:bg-[#3A3B3C] dark:text-white dark:hover:bg-[#4E4F50]"
              >
                Edit
              </button>
            </div>
          ) : claim ? (
            <div
              role="status"
              className={`flex min-h-14 items-center justify-center gap-2 rounded-t-[17px] px-3 text-center text-base font-bold text-[#1C1C1E] ${
                isBought ? 'bg-[#91D66D]' : 'bg-[#F4B400]'
              }`}
            >
              <HugeiconsIcon icon={isBought ? Tick02Icon : ShoppingBag01Icon} size={20} />
              <span className="truncate">
                {claim.claimer_alias ? `Claimed by ${claim.claimer_alias}` : 'Claimed'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClaimClick}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-t-[17px] bg-[var(--theme-action)] px-3 text-base font-bold text-white transition hover:bg-[var(--theme-hover)] active:scale-[0.98]"
            >
              <HugeiconsIcon icon={ShoppingBag01Icon} size={19} />
              <span>Claim Gift</span>
            </button>
          )}
        </div>
      </div>

      {/* FULL IMAGE LIGHTBOX MODAL */}
      {showLightbox && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col items-center px-2 pt-12 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute top-1 right-1 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 shadow-md border-0"
              aria-label="Close full image view"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>

            {/* Uncropped Image */}
            <img
              src={item.image_url}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[min(70vh,calc(100dvh-14rem))] object-contain rounded-lg shadow-2xl bg-black/40"
              onError={(e) => {
                handleImageFallbackError(e, item.image_url);
              }}
            />

            {/* Title & Price Caption */}
            <div className="mt-3.5 mb-2 text-center text-white w-full max-w-2xl shrink-0">
              <h4 className="font-bold text-base sm:text-lg leading-snug drop-shadow-sm">
                {item.title}
              </h4>
              {cleanUrl && (
                <div className="pt-2">
                  <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[var(--theme-action)] hover:bg-[var(--theme-hover)] transition active:scale-95 shadow-md border-0"
                  >
                    <HugeiconsIcon icon={LinkSquare01Icon} size={15} />
                    <span>Open in Store ({getDomain(cleanUrl)})</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
