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
} from '@hugeicons/core-free-icons';

export default function WishlistCard({
  item,
  onEdit,
  onClaim,
  onEditClaim,
  onReleaseClaim,
  onQuickMark,
}) {
  const { triggerLight } = useHaptics();
  const [showLightbox, setShowLightbox] = useState(false);

  const isOwner = item.is_owner;
  const claim = item.claim;

  const isBought = claim?.status === 'bought' || claim?.status === 'purchased';
  const isWantToBuy = claim?.status === 'want_to_buy' || claim?.status === 'claimed';

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Store Link';
    }
  };

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
      <div className="group rounded-xl p-2 sm:p-2.5 transition-colors duration-150 hover:bg-[#F2F4F7] dark:hover:bg-[#2A2B2D] flex flex-col justify-between">
        <div>
          {/* Image container — square aspect ratio like FB Marketplace */}
          <div
            onClick={item.image_url ? handleOpenLightbox : undefined}
            className="relative w-full aspect-square bg-[#F0F2F5] dark:bg-[#3A3B3C] overflow-hidden rounded-lg cursor-pointer"
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#B0B3B8] dark:text-[#65676B]">
                <HugeiconsIcon icon={GiftIcon} size={42} />
              </div>
            )}

            {/* Sale badge overlay — top-left */}
            {item.is_on_sale && (
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[var(--theme-primary)] text-white rounded">
                  <HugeiconsIcon icon={DiscountTag01Icon} size={11} />
                  Sale
                </span>
              </div>
            )}

            {/* Claim status overlay — top-right, only for non-owner */}
            {!isOwner && claim && (
              <div className="absolute top-2 right-2">
                {isBought ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#34C759] text-white rounded shadow-sm">
                    <HugeiconsIcon icon={Tick02Icon} size={11} />
                    Bought
                  </span>
                ) : isWantToBuy ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#FF9500] text-white rounded shadow-sm">
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={11} />
                    Claimed
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Card body — minimal, like FB Marketplace listing */}
          <div className="pt-2 pb-1 space-y-0.5">
            {/* Price — bold, prominent, first line */}
            {priceDisplay && (
              <div className="flex items-center gap-1.5">
                <span className={`text-[15px] font-bold leading-tight ${
                  priceDisplay === 'FREE'
                    ? 'text-[var(--theme-primary)]'
                    : 'text-[#050505] dark:text-[#E4E6EB]'
                }`}>
                  {priceDisplay}
                </span>
                {item.is_on_sale && (
                  <HugeiconsIcon icon={DiscountTag01Icon} size={13} className="text-[var(--theme-primary)]" />
                )}
              </div>
            )}

            {/* Title — single line, truncated */}
            <h4 className="text-[13px] text-[#050505] dark:text-[#E4E6EB] leading-snug line-clamp-2 font-normal">
              {item.title}
            </h4>

            {/* Priority — subtle text */}
            <p className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] leading-tight">
              {item.priority === 'high' || item.priority === 'must_have'
                ? 'High priority'
                : item.priority === 'low'
                ? 'Low priority'
                : 'Medium priority'}
            </p>

            {/* Store link — subtle, inline */}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-[var(--theme-primary)] hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <HugeiconsIcon icon={LinkSquare01Icon} size={11} />
                {getDomain(item.url)}
              </a>
            )}
          </div>
        </div>

        {/* Action button — ALWAYS VISIBLE at all times (not hidden behind hover) */}
        <div className="mt-2 pt-1">
          {isOwner ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="w-full py-1.5 px-3 text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] rounded-md transition active:scale-[0.98] border-0 flex items-center justify-center gap-1.5"
            >
              <HugeiconsIcon icon={PencilEdit02Icon} size={13} />
              <span>Edit Gift</span>
            </button>
          ) : claim ? (
            claim.is_claimed_by_viewer ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleEditClaimClick(); }}
                  className="flex-1 py-1.5 px-2 text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] rounded-md transition active:scale-[0.98] border-0"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onReleaseClaim(item.id); }}
                  className="py-1.5 px-2 text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 rounded-md transition active:scale-[0.98] border-0"
                >
                  Release
                </button>
              </div>
            ) : (
              <div className="text-center text-[11px] text-[#65676B] dark:text-[#B0B3B8] py-1 font-medium bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-md">
                Claimed by {claim.claimed_by_alias}
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClaimClick(); }}
              className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] rounded-md transition active:scale-[0.98] border-0"
            >
              Mark this Gift
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
            className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 shadow-md border-0"
              aria-label="Close full image view"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>

            {/* Uncropped Image */}
            <img
              src={item.image_url}
              alt={item.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-black/40"
            />

            {/* Title & Price Caption */}
            <div className="mt-3.5 text-center text-white max-w-lg">
              <h4 className="font-bold text-base sm:text-lg leading-snug drop-shadow-sm">
                {item.title}
              </h4>
              {item.price !== null && item.price !== undefined && (
                <p className="text-xs sm:text-sm font-semibold mt-1">
                  {item.is_on_sale ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[var(--theme-primary)] text-white font-bold">
                      <HugeiconsIcon icon={DiscountTag01Icon} size={13} />
                      <span>${Number(item.price).toFixed(2)} (Sale)</span>
                    </span>
                  ) : (
                    <span className="text-white/80">${Number(item.price).toFixed(2)}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
