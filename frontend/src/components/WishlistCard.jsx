import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHaptics } from '../context/HapticsContext';
import { useTheme } from '../context/ThemeContext';
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
  const { themeId, isDark } = useTheme();
  const [showLightbox, setShowLightbox] = useState(false);

  // Festive Christmas background ambient blurred circle accents
  const isChristmasTheme = themeId === 'christmas_duo' || themeId === 'christmas';
  const festiveGlowColors = isChristmasTheme
    ? [isDark ? '#FF453A' : '#FF3B30', isDark ? '#30D158' : '#34C759']
    : null;

  const isOwner = item.is_owner;
  const claim = item.claim;

  const isBought = claim?.status === 'bought' || claim?.status === 'purchased';
  const isWantToBuy = claim?.status === 'want_to_buy' || claim?.status === 'claimed';

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
      <div className="group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-colors duration-150 hover:bg-[#F2F4F7] dark:hover:bg-[#2A2B2D] flex flex-col justify-between border-0 outline-none">
        {/* Festive blurred background accent circles for Christmas & Birthday themes */}
        {festiveGlowColors && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl" aria-hidden="true">
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
          {/* Image container — square aspect ratio like FB Marketplace */}
          <div
            onClick={item.image_url ? handleOpenLightbox : undefined}
            className="relative w-full aspect-square bg-[#F0F2F5] dark:bg-[#3A3B3C] overflow-hidden rounded-xl cursor-pointer"
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                onError={(e) => {
                  handleImageFallbackError(e, item.image_url);
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[var(--theme-primary)] text-white rounded-md shadow-sm">
                  <HugeiconsIcon icon={DiscountTag01Icon} size={11} />
                  Sale
                </span>
              </div>
            )}

            {/* Claim status overlay — top-right, only for non-owner */}
            {!isOwner && claim && (
              <div className="absolute top-2 right-2">
                {isBought ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#34C759] text-white rounded-md shadow-sm">
                    <HugeiconsIcon icon={Tick02Icon} size={11} />
                    Purchased
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#FF9500] text-white rounded-md shadow-sm">
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={11} />
                    Claimed
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Details Area — compact FB Marketplace typography */}
          <div className="pt-2 sm:pt-2.5 pb-1">
            {/* Prominent Price Display */}
            {priceDisplay && (
              <div className="font-bold text-[16px] sm:text-[17px] text-[#050505] dark:text-[#E4E6EB] leading-tight mb-0.5">
                {priceDisplay}
              </div>
            )}

            {/* Title — 2 lines max */}
            <h3
              onClick={item.image_url ? handleOpenLightbox : undefined}
              className="text-[14px] sm:text-[15px] font-normal text-[#050505] dark:text-[#E4E6EB] leading-snug line-clamp-2 cursor-pointer hover:underline"
            >
              {item.title}
            </h3>

            {/* Subtle Metadata: store domain or owner hint */}
            <div className="text-[12px] text-[#65676B] dark:text-[#B0B3B8] mt-0.5 truncate">
              {cleanUrl ? getDomain(cleanUrl) : 'Wishlist Gift'}
            </div>

            {/* Private Claimer Note indicator (if claimed by current viewer) */}
            {!isOwner && claim?.is_claimed_by_viewer && claim?.notes && (
              <div className="mt-1 text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] italic line-clamp-1">
                Note: {claim.notes}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer: Action Buttons (FB Marketplace Style) */}
        <div className="pt-2 border-t border-[#E4E6EB] dark:border-[#3A3B3C] mt-2 relative z-[1]">
          {isOwner ? (
            /* OWNER CONTROLS: Edit button and optional Delete button */
            <div className="flex items-center gap-1.5 w-full">
              <button
                type="button"
                onClick={() => {
                  triggerLight();
                  onEdit(item);
                }}
                className={`${canDelete && onDelete ? 'flex-1' : 'w-full'} h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] transition active:scale-95 border-0`}
              >
                <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
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
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[#65676B] hover:text-[#FF3B30] dark:text-[#B0B3B8] dark:hover:text-[#FF453A] hover:bg-[#FF3B30]/10 dark:hover:bg-[#FF453A]/15 transition active:scale-95 shrink-0 border-0"
                  title="Delete gift from wishlist"
                  aria-label="Delete gift from wishlist"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                </button>
              )}

              {cleanUrl && (
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] transition shrink-0"
                  title="Open store link"
                  aria-label="Open store link"
                >
                  <HugeiconsIcon icon={LinkSquare01Icon} size={16} />
                </a>
              )}
            </div>
          ) : (
            /* NON-OWNER: Claim / Coordinate Buttons */
            <div className="flex items-center gap-1.5 w-full">
              {claim?.is_claimed_by_viewer ? (
                /* Already claimed by viewer: Quick Mark + Edit Claim */
                <>
                  <button
                    type="button"
                    onClick={() => onQuickMark?.(item)}
                    className={`flex-1 h-9 px-2.5 rounded-lg text-xs font-semibold transition border-0 active:scale-95 inline-flex items-center justify-center gap-1 ${
                      isBought
                        ? 'bg-[#34C759]/15 text-[#34C759] hover:bg-[#34C759]/25'
                        : 'bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-hover)]'
                    }`}
                  >
                    <HugeiconsIcon icon={isBought ? Tick02Icon : ShoppingBag01Icon} size={13} />
                    <span>{isBought ? 'Bought' : 'Mark Bought'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEditClaimClick}
                    className="h-9 px-2.5 rounded-lg text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] transition active:scale-95 border-0"
                  >
                    Edit
                  </button>
                </>
              ) : claim ? (
                /* Claimed by another family member: Show claimed notice */
                <div className="w-full h-9 px-2.5 rounded-lg text-xs font-semibold bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#65676B] dark:text-[#B0B3B8] flex items-center justify-center truncate">
                  Claimed by {claim.claimer_alias || 'family'}
                </div>
              ) : (
                /* Unclaimed: Claim button */
                <button
                  type="button"
                  onClick={handleClaimClick}
                  className="w-full h-9 px-3 rounded-lg text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition active:scale-95 shadow-sm inline-flex items-center justify-center gap-1.5 border-0"
                >
                  <HugeiconsIcon icon={ShoppingBag01Icon} size={14} />
                  <span>Claim Gift</span>
                </button>
              )}

              {cleanUrl && (
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] transition shrink-0"
                  title="Open store link"
                  aria-label="Open store link"
                >
                  <HugeiconsIcon icon={LinkSquare01Icon} size={16} />
                </a>
              )}
            </div>
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
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-black/40"
              onError={(e) => {
                handleImageFallbackError(e, item.image_url);
              }}
            />

            {/* Title & Price Caption */}
            <div className="mt-3.5 text-center text-white max-w-lg">
              <h4 className="font-bold text-base sm:text-lg leading-snug drop-shadow-sm">
                {item.title}
              </h4>
              {cleanUrl && (
                <div className="pt-2">
                  <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition active:scale-95 shadow-md border-0"
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
