import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  UserGroupIcon,
  Copy01Icon,
  Tick02Icon,
  Logout01Icon,
  Link01Icon,
  Menu01Icon,
  Cancel01Icon,
  Sun01Icon,
  Moon02Icon,
  Settings02Icon,
  PaintBoardIcon,
} from '@hugeicons/core-free-icons';

export default function Navbar({ onOpenAdmin, onOpenProfile }) {
  const { user, family, isAdmin, logout } = useAuth();
  const { theme, isDark, toggleDarkMode } = useTheme();
  const { triggerMedium, triggerSuccess, triggerLight } = useHaptics();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
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

  const copyFamilyCode = () => {
    if (!family?.code) return;
    navigator.clipboard.writeText(family.code);
    triggerSuccess();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleMobileAction = (actionFn) => {
    triggerLight();
    setMobileMenuOpen(false);
    if (actionFn) actionFn();
  };

  const handleToggleDark = () => {
    triggerMedium();
    toggleDarkMode();
  };

  const navbarBackground = isDark
    ? (theme.navbarBgDark || theme.primary)
    : (theme.navbarBg || theme.gradient || theme.primary);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full shadow-apple-md transition-colors duration-300 border-b border-black/10 dark:border-white/10 text-white"
        style={{
          background: navbarBackground,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between text-white">
          {/* Brand & Family Info */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-apple-sm shrink-0">
              <HugeiconsIcon icon={GiftIcon} size={20} className="nav:hidden" />
              <HugeiconsIcon icon={GiftIcon} size={22} className="hidden nav:block" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-heading font-bold text-white tracking-tight text-lg sm:text-xl whitespace-nowrap drop-shadow-sm">
                  WhatGift
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-white/80">
                <span className="font-semibold text-white/95 max-w-[120px] min-[360px]:max-w-[150px] min-[390px]:max-w-[180px] min-[440px]:max-w-[240px] sm:max-w-[320px] tablet:max-w-[420px] truncate whitespace-nowrap">
                  {family?.name}
                </span>
                <span className="text-white/50">·</span>
                {/* Shorten to just a LINK icon button on narrow mobile views to prevent navbar overlap */}
                <button
                  type="button"
                  onClick={copyInviteLink}
                  title={`Copy invite link (Code: ${family?.code || ''})`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 rounded-lg bg-white/20 hover:bg-white/30 border-0 text-white transition text-[11px] font-medium shadow-apple-sm whitespace-nowrap shrink-0 backdrop-blur-md active:scale-95"
                  aria-label="Copy family invite link"
                >
                  {copiedLink ? (
                    <HugeiconsIcon icon={Tick02Icon} size={12} className="text-[#34C759]" />
                  ) : (
                    <HugeiconsIcon icon={Link01Icon} size={12} className="text-white/90" />
                  )}
                  <span className="hidden sm:inline font-mono">{family?.code}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP ACTIONS (hidden on mobile/tablet < nav: 880px) */}
          {/* ========================================================================= */}
          <div className="hidden nav:flex items-center gap-2.5 lg:gap-3 shrink-0">
            {/* Dark Mode Quick Toggle */}
            <button
              type="button"
              onClick={handleToggleDark}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-white/90 hover:text-white bg-white/20 hover:bg-white/30 border-0 shadow-apple-sm transition active:scale-95 shrink-0 backdrop-blur-md"
              aria-label="Toggle Dark Mode"
            >
              <HugeiconsIcon icon={isDark ? Sun01Icon : Moon02Icon} size={18} />
            </button>

            {/* Copy Invite Link Button */}
            <button
              type="button"
              onClick={copyInviteLink}
              title="Copy direct invite link for family members"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/20 hover:bg-white/30 text-white border-0 shadow-apple-sm transition active:scale-95 whitespace-nowrap shrink-0 backdrop-blur-md"
            >
              {copiedLink ? (
                <>
                  <HugeiconsIcon icon={Tick02Icon} size={15} className="text-[#34C759]" />
                  <span className="text-[#34C759] font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Link01Icon} size={15} className="text-white/80" />
                  <span>
                    Copy <span className="hidden lg:inline">Invite </span>Link
                  </span>
                </>
              )}
            </button>

            {/* Admin Panel Launcher */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/20 hover:bg-white/30 text-white border-0 shadow-apple-sm transition active:scale-95 whitespace-nowrap shrink-0 backdrop-blur-md"
              >
                <HugeiconsIcon icon={UserGroupIcon} size={15} className="text-white/80" />
                <span>Manage Family</span>
              </button>
            )}

            {/* User Settings Button (Settings Icon replacing avatar) */}
            <div className="flex items-center gap-2 pl-2 lg:pl-3 border-l border-white/20 shrink-0">
              <button
                type="button"
                onClick={onOpenProfile}
                title="Settings & Appearance"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 border-0 shadow-apple-sm transition active:scale-95 group whitespace-nowrap shrink-0 text-white backdrop-blur-md"
              >
                <HugeiconsIcon
                  icon={Settings02Icon}
                  size={18}
                  className="text-white/90 group-hover:text-white transition-colors"
                />
                <span className="font-semibold text-xs sm:text-sm hidden md:inline text-white">
                  Settings
                </span>
              </button>

              {/* Leave Family Button */}
              <button
                type="button"
                onClick={logout}
                title={`Leave the ${family?.name || 'Family'}`}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition shrink-0 active:scale-95 border-0"
                aria-label={`Leave the ${family?.name || 'Family'}`}
              >
                <HugeiconsIcon icon={Logout01Icon} size={18} />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE ACTIONS: Settings Icon + Hamburger Toggle (< nav: 880px) */}
          {/* ========================================================================= */}
          <div className="flex nav:hidden items-center gap-1.5 shrink-0">
            {/* Quick Dark Mode Toggle - Matched to w-9 h-9 */}
            <button
              type="button"
              onClick={handleToggleDark}
              title={isDark ? 'Switch to Light' : 'Switch to Dark'}
              className="w-9 h-9 rounded-xl text-white/90 hover:text-white bg-white/20 hover:bg-white/30 border-0 shadow-apple-sm transition active:scale-95 flex items-center justify-center shrink-0"
              aria-label="Toggle Dark Mode"
            >
              <HugeiconsIcon icon={isDark ? Sun01Icon : Moon02Icon} size={18} />
            </button>

            {/* Settings Icon button */}
            <button
              type="button"
              onClick={onOpenProfile}
              title="Settings & Appearance"
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-95 shadow-apple-sm transition text-white border-0 shrink-0"
              aria-label="Settings"
            >
              <HugeiconsIcon icon={Settings02Icon} size={18} />
            </button>

            {/* Hamburger Menu Toggle Button - Matched to w-9 h-9 */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl text-white bg-white/20 hover:bg-white/30 border-0 transition active:scale-95 shadow-apple-sm flex items-center justify-center shrink-0"
              aria-label={mobileMenuOpen ? 'Close Navigation Sidebar' : 'Open Navigation Sidebar'}
              aria-expanded={mobileMenuOpen}
            >
              <HugeiconsIcon icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon} size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OVER SIDEBAR PORTAL (Attached to document.body to avoid header clipping) */}
      {/* ========================================================================= */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Full Screen Dim Backdrop with Smooth Fade Animation */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-backdrop-fade"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* True Full-Height Opaque Sidebar Drawer with Smooth Slide-In Animation */}
          <aside className="relative z-10 w-80 max-w-[85vw] h-full h-screen h-dvh bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-sidebar-slide border-l border-black/[0.08] dark:border-white/[0.12]">
            <div className="space-y-4">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--theme-primary)] flex items-center justify-center text-white shadow-apple-sm">
                    <HugeiconsIcon icon={GiftIcon} size={17} />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-[#1C1C1E] dark:text-white tracking-tight">
                      WhatGift
                    </div>
                    <div className="text-[11px] font-semibold text-[#8E8E93] truncate max-w-[140px]">
                      {family?.name}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition"
                  aria-label="Close Sidebar"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              {/* User Profile Card */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] shadow-apple-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{user?.avatar || '🎁'}</span>
                  <div>
                    <div className="font-bold text-sm text-[#1C1C1E] dark:text-white">
                      {user?.alias}
                    </div>
                    <div className="text-[11px] text-[#8E8E93]">{family?.name}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMobileAction(onOpenProfile)}
                  className="text-xs font-bold text-[var(--theme-primary)] hover:underline flex items-center gap-1"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={14} />
                  <span>Settings</span>
                </button>
              </div>

              {/* Navigation Action Links */}
              <div className="space-y-2 pt-1">
                {/* Copy Invite Link */}
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold bg-[var(--theme-tint)] text-[var(--theme-primary)] hover:opacity-90 transition active:scale-98 shadow-apple-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon icon={Link01Icon} size={17} />
                    <span>Copy Invite Link</span>
                  </div>
                  {copiedLink ? (
                    <span className="text-[#34C759] font-bold flex items-center gap-1">
                      <HugeiconsIcon icon={Tick02Icon} size={14} /> Copied!
                    </span>
                  ) : (
                    <span className="text-[11px] opacity-75">Share</span>
                  )}
                </button>

                {/* Admin Management (if Admin) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleMobileAction(onOpenAdmin)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-bold text-[#1C1C1E] dark:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] transition shadow-apple-sm"
                  >
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      size={17}
                      className="text-[var(--theme-primary)]"
                    />
                    <span>Manage Family & Members</span>
                  </button>
                )}

                {/* Appearance / Dark Mode Toggle Row */}
                <button
                  type="button"
                  onClick={handleToggleDark}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold text-[#1C1C1E] dark:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] transition shadow-apple-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon
                      icon={isDark ? Sun01Icon : Moon02Icon}
                      size={17}
                      className="text-[var(--theme-primary)]"
                    />
                    <span>Appearance</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#8E8E93] bg-white dark:bg-[#1C1C1E] px-2.5 py-1 rounded-xl shadow-apple-sm">
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </button>

                {/* Theme & Holiday Accent Settings */}
                <button
                  type="button"
                  onClick={() => handleMobileAction(onOpenProfile)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold text-[#1C1C1E] dark:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] transition shadow-apple-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon
                      icon={PaintBoardIcon}
                      size={17}
                      className="text-[var(--theme-primary)]"
                    />
                    <span>Holiday Theme</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--theme-primary)]">
                    {theme.name}
                  </span>
                </button>
              </div>
            </div>

            {/* Sidebar Footer: Leave Family */}
            <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#2C2C2E] mt-auto">
              <button
                type="button"
                onClick={() => handleMobileAction(logout)}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl text-xs font-bold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 transition shadow-apple-sm"
              >
                <HugeiconsIcon icon={Logout01Icon} size={16} />
                <span>Leave the {family?.name || 'Family'}</span>
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
