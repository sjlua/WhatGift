import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  UserGroupIcon,
  Tick02Icon,
  Logout01Icon,
  Link01Icon,
  Menu01Icon,
  Cancel01Icon,
  Settings02Icon,
  PaintBoardIcon,
  UserSettings01Icon,
  Add01Icon,
  CircleQuestionMarkIcon,
} from '@hugeicons/core-free-icons';

export default function Navbar({ onOpenAdmin, onOpenProfile, onOpenSetupHelp, activeTab, onSelectTab }) {
  const { user, family, isAdmin, logout } = useAuth();
  const { theme, isDark, isChristmasTheme, seasonalAtmosphere, christmasDays } = useTheme();
  const { triggerSuccess, triggerLight } = useHaptics();
  const [copiedLink, setCopiedLink] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const copyInviteLink = () => {
    if (!family?.code) return;
    const url = `${window.location.origin}/?family=${encodeURIComponent(family.code)}`;
    navigator.clipboard.writeText(url);
    triggerSuccess();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleMobileAction = (actionFn) => {
    triggerLight();
    setMobileMenuOpen(false);
    if (actionFn) actionFn();
  };

  return (
    <>
      {/* Mobile Sticky Header with Theme Tint (no gradient!) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 w-full bg-[var(--theme-header-bg)] backdrop-blur-md border-b border-[var(--theme-header-border)] pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 px-4 transition-colors">
        <div className="flex items-center justify-between h-12">
          {/* Brand & Family Info */}
          <button
            type="button"
            onClick={() => {
              triggerLight();
              onSelectTab?.('my-wishes');
            }}
            className="flex items-center gap-2.5 text-left border-0 bg-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-white shrink-0 shadow-apple-sm">
              <HugeiconsIcon icon={GiftIcon} size={18} />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] leading-tight">
                  WhatGift
                </span>
                {isChristmasTheme && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/70 dark:bg-[#3A3B3C]/80 border border-[var(--theme-header-border)] text-[#050505] dark:text-[#E4E6EB]">
                    {seasonalAtmosphere === 'sun' ? '☀️' : '🎄'} {christmasDays} days
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-[#65676B] dark:text-[#B0B3B8] truncate max-w-[140px]">
                {family?.name}
              </span>
            </div>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={copyInviteLink}
              title="Copy family invite link"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] transition border-0"
              aria-label="Copy family invite link"
            >
              {copiedLink ? (
                <>
                  <HugeiconsIcon icon={Tick02Icon} size={13} className="text-[#34C759]" />
                  <span className="text-[#34C759]">Copied</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Link01Icon} size={13} />
                  <span>Invite</span>
                </>
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  triggerLight();
                  onOpenSetupHelp?.();
                }}
                title="How to Set Up (Admin Guide)"
                aria-label="How to Set Up"
                className="w-8 h-8 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] transition flex items-center justify-center border-0 active:scale-95"
              >
                <HugeiconsIcon icon={CircleQuestionMarkIcon} size={17} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] transition flex items-center justify-center border-0"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              <HugeiconsIcon icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon} size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER SIDEBAR PORTAL */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Full Screen Dim Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-[300px] max-w-[85vw] h-full bg-white dark:bg-[#242526] z-10 flex flex-col justify-between py-4 shadow-apple-lg animate-sidebar-slide border-l border-[#E4E6EB] dark:border-[#3A3B3C]">
            <div className="space-y-4">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                <div className="flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center justify-center text-xl shrink-0 shadow-sm">
                    {user?.avatar || '🎁'}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-[#050505] dark:text-[#E4E6EB] block truncate">
                      {user?.alias}
                    </span>
                    <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] block truncate">
                      {family?.name}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition border-0"
                  aria-label="Close Menu"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="w-full">
                <button
                  type="button"
                  onClick={() => handleMobileAction(() => onSelectTab?.('my-wishes'))}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition border-0 rounded-none ${
                    activeTab === 'my-wishes'
                      ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] border-l-4 border-l-[var(--theme-primary)]'
                      : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] border-l-4 border-l-transparent'
                  }`}
                >
                  <HugeiconsIcon icon={GiftIcon} size={18} />
                  <span>My Wishlist</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMobileAction(() => onSelectTab?.('family-wishes'))}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition border-0 rounded-none ${
                    activeTab === 'family-wishes'
                      ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] border-l-4 border-l-[var(--theme-primary)]'
                      : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] border-l-4 border-l-transparent'
                  }`}
                >
                  <HugeiconsIcon icon={UserGroupIcon} size={18} />
                  <span>Family Wishlists</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleMobileAction(onOpenAdmin)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition border-0 rounded-none ${
                      activeTab === 'admin'
                        ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] border-l-4 border-l-[var(--theme-primary)]'
                        : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <HugeiconsIcon icon={UserSettings01Icon} size={18} />
                      <span>Manage Family</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                      Admin
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleMobileAction(onOpenProfile)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition border-0 rounded-none ${
                    activeTab === 'settings'
                      ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] border-l-4 border-l-[var(--theme-primary)]'
                      : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] border-l-4 border-l-transparent'
                  }`}
                >
                  <HugeiconsIcon icon={Settings02Icon} size={18} />
                  <span>Settings & Preferences</span>
                </button>
              </nav>
            </div>

            {/* Logout button */}
            <div className="px-4 pt-3 border-t border-[#E4E6EB] dark:border-[#3A3B3C]">
              <button
                type="button"
                onClick={() => {
                  triggerLight();
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 transition border-0 active:scale-95"
              >
                <HugeiconsIcon icon={Logout01Icon} size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
