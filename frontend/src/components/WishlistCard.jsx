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
  Maximize01Icon,
  DiscountTag01Icon,
} from '@hugeicons/core-free-icons';

const PRIORITY_BADGES = {
  high: { label: 'HIGH', style: 'bg-[#FF9500]/15 text-[#C46200]' },
  medium: { label: 'MEDIUM', style: 'bg-[var(--theme-tint)] text-[var(--theme-primary)]' },
  low: { label: 'LOW', style: 'bg-[#8E8E93]/15 text-[#636366]' },
  must_have: { label: 'HIGH', style: 'bg-[#FF9500]/15 text-[#C46200]' },
};

export default function WishlistCard({
  item,
  onEdit,
  onClaim,
  onEditClaim,
  onReleaseClaim,
}) {
  const { triggerLight } = useHaptics();
  const [showLightbox, setShowLightbox] = useState(false);

  const priorityInfo = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.medium;
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

  return (
    <>
      <div className="relative bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple-card hover:shadow-apple-card-hover transition-all duration-200 flex flex-col overflow-hidden border-0">
        {/* Product Image with Click-to-Expand Lightbox */}
        {item.image_url ? (
          <div
            onClick={handleOpenLightbox}
            className="relative w-full h-44 sm:h-48 md:h-52 bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden cursor-pointer group"
            title="Click to view full image"
          >
            <img
              src={item.image_url}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span
              className={`absolute top-3 right-3 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-apple-sm backdrop-blur-md ${priorityInfo.style} bg-white/95 dark:bg-[#1C1C1E]/95`}
            >
              {priorityInfo.label}
            </span>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md shadow-apple-sm">
                <HugeiconsIcon icon={Maximize01Icon} size={13} />
                <span>View Full Image</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 sm:p-5 pb-0">
            <div className="w-9 h-9 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93]">
              <HugeiconsIcon icon={GiftIcon} size={18} />
            </div>
            <span className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full ${priorityInfo.style}`}>
              {priorityInfo.label}
            </span>
          </div>
        )}

        {/* Card Body: Unified Content with Uniform Spacing */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Title & Price */}
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <h4 className="font-heading font-bold text-base sm:text-lg text-[#1C1C1E] dark:text-white leading-snug break-words">
                {item.title}
              </h4>

              {/* Price Tag: Highlighted with accent colour if on sale, otherwise monochrome black/white */}
              {item.price !== null && item.price !== undefined && (
                <span
                  className={`shrink-0 text-sm sm:text-base font-extrabold px-2.5 py-0.5 rounded-lg shadow-apple-sm transition-all duration-200 inline-flex items-center gap-1.5 ${
                    item.is_on_sale
                      ? 'bg-[var(--theme-primary)] text-white shadow-apple-md ring-1 ring-white/20'
                      : 'text-[#1C1C1E] dark:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E]'
                  }`}
                  title={item.is_on_sale ? 'On Sale' : undefined}
                >
                  {item.is_on_sale && (
                    <HugeiconsIcon icon={DiscountTag01Icon} size={14} className="shrink-0" />
                  )}
                  <span>${Number(item.price).toFixed(2)}</span>
                </span>
              )}
            </div>

            {item.description && (
              <p className="text-xs sm:text-sm text-[#636366] dark:text-[#8E8E93] line-clamp-3 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            )}
          </div>

          {/* Action Area: Store Links & Edit/Mark Gift Button grouped closely together */}
          <div className="space-y-2 mt-4">
            {/* Store Links: Positioned directly above Edit/Mark with tight 8px spacing */}
            {(item.url || item.alt_url) && (
              <div className="space-y-2 w-full">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-[var(--theme-primary)] bg-[var(--theme-tint)] hover:opacity-90 rounded-xl shadow-apple-sm transition active:scale-95 border-0"
                  >
                    <HugeiconsIcon icon={LinkSquare01Icon} size={15} />
                    <span>{getDomain(item.url)}</span>
                  </a>
                )}

                {item.alt_url && (
                  <a
                    href={item.alt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-[#636366] dark:text-[#E5E5EA] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] rounded-xl shadow-apple-sm transition active:scale-95 border-0"
                  >
                    <HugeiconsIcon icon={LinkSquare01Icon} size={15} />
                    <span>Alt: {getDomain(item.alt_url)}</span>
                  </a>
                )}
              </div>
            )}

            {isOwner ? (
              /* OWNER VIEW: Clean Edit Gift button */
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] rounded-xl shadow-apple-sm transition active:scale-95 border-0"
              >
                <HugeiconsIcon icon={PencilEdit02Icon} size={15} />
                <span>Edit Gift</span>
              </button>
            ) : (
              /* FAMILY MEMBER VIEW */
              <div>
              {claim ? (
                <div className="space-y-2.5">
                  {/* Status Badge with Purchaser Emoji Avatar */}
                  <div
                    className={`p-3 rounded-2xl text-xs flex flex-col gap-2 shadow-apple-sm transition-all border-0 ${
                      isBought
                        ? 'bg-[#34C759]/15 dark:bg-[#34C759]/20 text-[#1B8036] dark:text-[#30D158]'
                        : 'bg-[#FF9500]/15 dark:bg-[#FF9500]/20 text-[#B25900] dark:text-[#FF9F0A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                        {isBought ? (
                          <>
                            <HugeiconsIcon icon={Tick02Icon} size={17} />
                            <span>Bought</span>
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={ShoppingBag01Icon} size={17} />
                            <span>Want to Buy</span>
                          </>
                        )}
                      </span>

                      {/* Purchaser Avatar & Alias */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-apple-sm font-bold text-xs shrink-0">
                        <span className="text-base leading-none">
                          {claim.claimed_by_avatar || '🎁'}
                        </span>
                        <span>{claim.claimed_by_alias || 'Family member'}</span>
                      </div>
                    </div>

                    {claim.notes && (
                      <div className="text-[11px] text-[#636366] dark:text-[#8E8E93] pt-1.5 border-t border-black/[0.06] dark:border-white/[0.08] italic">
                        "{claim.notes}"
                      </div>
                    )}
                  </div>

                  {claim.is_claimed_by_viewer ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleEditClaimClick}
                        className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] rounded-xl shadow-apple-sm transition active:scale-95"
                      >
                        Update Mark
                      </button>
                      <button
                        type="button"
                        onClick={() => onReleaseClaim(item.id)}
                        className="py-2 px-3 text-xs sm:text-sm font-semibold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 rounded-xl shadow-apple-sm transition active:scale-95"
                      >
                        Unmark
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-[#8E8E93] py-1 font-semibold flex items-center justify-center gap-1.5">
                      <span>Marked by</span>
                      <span className="text-base leading-none">{claim.claimed_by_avatar || '🎁'}</span>
                      <span className="text-[#1C1C1E] dark:text-white">{claim.claimed_by_alias}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* UNMARKED ITEM: Direct Click to Mark */
                <button
                  type="button"
                  onClick={handleClaimClick}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-[0.98]"
                >
                  <HugeiconsIcon icon={GiftIcon} size={17} />
                  <span>Mark this Gift</span>
                </button>
              )}
            </div>
          )}
        </div>
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
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 shadow-apple-md"
              aria-label="Close full image view"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>

            {/* Uncropped Image */}
            <img
              src={item.image_url}
              alt={item.title}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-black/40"
            />

            {/* Title & Price Caption */}
            <div className="mt-3.5 text-center text-white max-w-lg">
              <h4 className="font-heading font-bold text-base sm:text-lg leading-snug drop-shadow-sm">
                {item.title}
              </h4>
              {item.price !== null && item.price !== undefined && (
                <p className="text-xs sm:text-sm font-semibold mt-1">
                  {item.is_on_sale ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--theme-primary)] text-white font-bold shadow-apple-sm">
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
