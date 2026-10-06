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
} from '@hugeicons/core-free-icons';

export default function Navbar({ onOpenAdmin, onOpenProfile, activeTab, onSelectTab }) {
  const { user, family, isAdmin, logout } = useAuth();
  const { theme, isDark } = useTheme();
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
      {/* Mobile Sticky Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 w-full bg-white dark:bg-[#242526] border-b border-[#E4E6EB] dark:border-[#3A3B3C] pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 px-4 transition-colors">
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
            <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-white shrink-0">
              <HugeiconsIcon icon={GiftIcon} size={18} />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] leading-tight">
                WhatGift
              </span>
              <span className="text-[11px] font-medium text-[#65676B] dark:text-[#B0B3B8] truncate max-w-[150px]">
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

            <button
              type="button"
              onClick={() => {
                triggerLight();
                onSelectTab?.('settings');
              }}
              title="Settings & Appearance"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition border-0 ${
                activeTab === 'settings'
                  ? 'bg-[var(--theme-primary)] text-white'
                  : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
              }`}
              aria-label="Settings"
            >
              <HugeiconsIcon icon={Settings02Icon} size={16} />
            </button>

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

          {/* Drawer */}
          <aside className="relative z-10 w-80 max-w-[85vw] h-full h-screen h-dvh bg-white dark:bg-[#242526] shadow-2xl flex flex-col justify-between p-5 overflow-y-auto overscroll-contain animate-sidebar-slide border-0 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1.25rem))] pt-[max(1.25rem,env(safe-area-inset-top))]">
            <div className="space-y-4">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-white">
                    <HugeiconsIcon icon={GiftIcon} size={17} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#050505] dark:text-[#E4E6EB]">
                      WhatGift
                    </div>
                    <div className="text-xs text-[#65676B] dark:text-[#B0B3B8] truncate max-w-[140px]">
                      {family?.name}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition border-0"
                  aria-label="Close Sidebar"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              {/* User Profile Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{user?.avatar || '🎁'}</span>
                  <div>
                    <div className="font-bold text-sm text-[#050505] dark:text-[#E4E6EB]">
                      {user?.alias}
                    </div>
                    <div className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
                      {isAdmin ? 'Family Admin' : 'Family Member'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Wishlist Navigation Links */}
              <div className="space-y-1 pt-1 border-b border-[#E4E6EB] dark:border-[#3A3B3C] pb-3">
                <button
                  type="button"
                  onClick={() => handleMobileAction(() => onSelectTab?.('my-wishes'))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition border-0 ${
                    activeTab === 'my-wishes'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <HugeiconsIcon icon={GiftIcon} size={18} />
                  <span>My Wishlist</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMobileAction(() => onSelectTab?.('family-wishes'))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition border-0 ${
                    activeTab === 'family-wishes'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <HugeiconsIcon icon={UserGroupIcon} size={18} />
                  <span>Family Wishlists</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMobileAction(() => onSelectTab?.('add-gift'))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition border-0 ${
                    activeTab === 'add-gift'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <HugeiconsIcon icon={Add01Icon} size={18} />
                  <span>Add New Gift</span>
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="space-y-1">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleMobileAction(() => onSelectTab?.('admin'))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition border-0 ${
                      activeTab === 'admin'
                        ? 'bg-[var(--theme-primary)] text-white'
                        : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
                    }`}
                  >
                    <HugeiconsIcon icon={UserSettings01Icon} size={18} />
                    <span>Manage Family</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleMobileAction(() => onSelectTab?.('settings'))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition border-0 ${
                    activeTab === 'settings'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <HugeiconsIcon icon={Settings02Icon} size={18} />
                  <span>Settings & Preferences</span>
                </button>

                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition border-0"
                >
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon icon={Link01Icon} size={18} className="text-[var(--theme-primary)]" />
                    <span>Copy Invite Link</span>
                  </div>
                  {copiedLink && (
                    <span className="text-[#34C759] text-xs font-bold">Copied!</span>
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar Footer: Sign Out */}
            <div className="pt-4 border-t border-[#E4E6EB] dark:border-[#3A3B3C] mt-auto shrink-0">
              <button
                type="button"
                onClick={() => handleMobileAction(logout)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 transition border-0"
              >
                <HugeiconsIcon icon={Logout01Icon} size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
