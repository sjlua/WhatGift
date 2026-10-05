import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ChangelogModal from './ChangelogModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { AVATAR_OPTIONS } from '../constants/avatars';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserIcon,
  PaintBoardIcon,
  SmartPhone01Icon,
  Logout01Icon,
  Tick02Icon,
  AlertCircleIcon,
  Share01Icon,
  Sun01Icon,
  Moon02Icon,
  ComputerIcon,
  Touch01Icon,
  SparklesIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';

export default function ProfileModal({ isOpen, onClose, onOpenAdmin }) {
  const { user, family, isAdmin, updateUserProfile, logout } = useAuth();
  const { theme, themeId, setThemeId, themes, darkMode, setDarkMode } = useTheme();
  const { hapticsEnabled, toggleHaptics, trigger, triggerSelection, triggerSuccess } = useHaptics();

  const [alias, setAlias] = useState('');
  const [avatar, setAvatar] = useState('🎁');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setAlias(user.alias || '');
      setAvatar(user.avatar || '🎁');
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alias.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await updateUserProfile({
        alias: alias.trim(),
        avatar,
      });
      triggerSuccess();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Profile & Settings" maxWidth="max-w-lg">
      <div className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]">
            <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 text-[#1B8036] dark:text-[#30D158]">
            <HugeiconsIcon icon={Tick02Icon} size={15} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Section 1: User Profile Settings (Name & Avatar used to login) */}
        <form onSubmit={handleSubmit} className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border-0 space-y-4 shadow-apple-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA] dark:border-[#38383A]">
            <span className="font-heading font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white flex items-center gap-2">
              <HugeiconsIcon icon={UserIcon} size={16} className="text-[var(--theme-primary)]" />
              Your Login Details
            </span>
            <span className="text-[11px] text-[#8E8E93]">Used to log in</span>
          </div>

          <div>
            <label className="block text-xs sm:text-[13px] font-bold font-sans text-[#1C1C1E] dark:text-white mb-1.5 flex items-center">
              <span>Your First Name / Alias</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF453A]/20 dark:text-[#FF453A] ml-1.5">
                Required
              </span>
            </label>
            <input
              type="text"
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] text-sm text-[#1C1C1E] dark:text-white focus:outline-none shadow-apple-sm transition"
            />
            <p className="text-[11px] text-[#8E8E93] mt-1 font-sans">
              You will use this first name to log into {family?.name}.
            </p>
          </div>

          {/* Profile Avatar Emojis */}
          <div>
            <label className="block text-xs font-bold font-sans text-[#1C1C1E] dark:text-white mb-1.5">
              Assigned Profile Avatar (Emoji)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white dark:bg-[#1C1C1E] rounded-xl border-0 shadow-inner">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setAvatar(emoji);
                    triggerSelection();
                  }}
                  className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                    avatar === emoji
                      ? 'bg-[var(--theme-tint)] ring-2 ring-[var(--theme-primary)] scale-110 shadow-apple-sm'
                      : 'hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !alias.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--theme-primary)] hover:opacity-90 shadow-apple-sm transition disabled:opacity-50 border-0 font-sans"
            >
              {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Section: Family Settings Shortcut */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border-0 space-y-3 shadow-apple-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA] dark:border-[#38383A]">
            <span className="font-heading font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} size={17} className="text-[var(--theme-primary)]" />
              Family Settings
            </span>
            <span className="text-[11px] font-semibold text-[#8E8E93] bg-white dark:bg-[#1C1C1E] px-2.5 py-0.5 rounded-full shadow-apple-sm">
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </div>
          <p className="text-xs text-[#636366] dark:text-[#8E8E93] leading-relaxed font-sans">
            {isAdmin
              ? `Manage ${family?.name || 'family'} name, invite code, members, and wishlist reset options.`
              : `${family?.name || 'Family'} settings, invite codes, and members are managed by the family organizer.`}
          </p>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                triggerSelection();
                onOpenAdmin?.();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold font-sans text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] shadow-apple-sm transition active:scale-95 flex items-center justify-center gap-2 border-0"
            >
              <HugeiconsIcon icon={UserGroupIcon} size={16} />
              <span>Open Family Settings</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] text-xs text-[#8E8E93] flex items-center justify-between shadow-apple-sm">
              <span>Family Code: <strong className="font-mono text-[#1C1C1E] dark:text-white">{family?.code}</strong></span>
              <span className="text-[11px]">Contact organizer for changes</span>
            </div>
          )}
        </div>

        {/* Section 2: Dark Mode & Appearance */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border-0 shadow-apple-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E5EA] dark:border-[#38383A]">
            <span className="font-heading font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white flex items-center gap-2">
              <HugeiconsIcon icon={Moon02Icon} size={16} className="text-[var(--theme-primary)]" />
              Appearance & Dark Mode
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Light', icon: Sun01Icon },
              { id: 'dark', label: 'Dark', icon: Moon02Icon },
              { id: 'system', label: 'System', icon: ComputerIcon },
            ].map(({ id, label, icon: IconComponent }) => {
              const isSelected = darkMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setDarkMode(id);
                    triggerSelection();
                  }}
                  className={`py-2.5 px-3 rounded-xl border-0 flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    isSelected
                      ? 'bg-white dark:bg-[#1C1C1E] text-[var(--theme-primary)] shadow-apple-sm ring-2 ring-[var(--theme-primary)]'
                      : 'bg-white/60 dark:bg-[#1C1C1E]/60 text-[#636366] dark:text-[#8E8E93] hover:bg-white dark:hover:bg-[#1C1C1E]'
                  }`}
                >
                  <HugeiconsIcon icon={IconComponent} size={18} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Holiday & Color Scheme Themings */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border-0 shadow-apple-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E5EA] dark:border-[#38383A]">
            <span className="font-heading font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white flex items-center gap-2">
              <HugeiconsIcon icon={PaintBoardIcon} size={16} className="text-[var(--theme-primary)]" />
              Holiday Accent Themes
            </span>
            <span className="text-[11px] font-semibold text-[var(--theme-primary)]">
              {theme.holiday}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {themes.map((t) => {
              const isSelected = themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    localStorage.setItem('whatgift_theme_customized', 'true');
                    setThemeId(t.id);
                    triggerSelection();
                  }}
                  className={`p-3 rounded-xl border-0 text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white dark:bg-[#1C1C1E] shadow-apple-sm ring-2 ring-[var(--theme-primary)]'
                      : 'bg-white/60 dark:bg-[#1C1C1E]/60 hover:bg-white dark:hover:bg-[#1C1C1E]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="w-4 h-4 rounded-full shadow-apple-sm border-0 shrink-0"
                      style={{ background: t.gradient || t.primary }}
                    />
                    {isSelected && (
                      <HugeiconsIcon icon={Tick02Icon} size={13} className="text-[var(--theme-primary)]" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C1C1E] dark:text-white">{t.name}</div>
                    <div className="text-[10px] text-[#8E8E93] truncate">{t.holiday}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Haptic Feedback Settings */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border-0 shadow-apple-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--theme-tint)] flex items-center justify-center text-[var(--theme-primary)] shrink-0">
                <HugeiconsIcon icon={Touch01Icon} size={18} />
              </div>
              <div>
                <div className="font-heading font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white">
                  Haptic Feedback (Vibrations)
                </div>
                <div className="text-[11px] text-[#8E8E93]">
                  Tactile feedback when tapping buttons, cards, and items
                </div>
              </div>
            </div>

            {/* Apple HIG Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={hapticsEnabled}
              onClick={toggleHaptics}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hapticsEnabled ? 'bg-[var(--theme-primary)]' : 'bg-[#E5E5EA] dark:bg-[#3A3A3C]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-apple-sm ring-0 transition duration-200 ease-in-out ${
                  hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {hapticsEnabled && (
            <div className="mt-3 pt-2.5 border-t border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-between">
              <span className="text-[11px] text-[#8E8E93]">
                Web Haptics active (iOS Taptic & Android Vibration)
              </span>
              <button
                type="button"
                onClick={() => trigger('medium')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[var(--theme-primary)] bg-white dark:bg-[#1C1C1E] shadow-apple-sm hover:opacity-90 transition active:scale-95 border-0"
              >
                Test Tap
              </button>
            </div>
          )}
        </div>

        {/* Section 5: What's New & Changelog */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border-0 shadow-apple-sm">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5E5EA] dark:border-[#38383A]">
            <span className="font-heading font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white flex items-center gap-2">
              <HugeiconsIcon icon={SparklesIcon} size={16} className="text-[var(--theme-primary)]" />
              What's New & Changelog
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-primary)] text-white">
              v1.1
            </span>
          </div>
          <p className="text-xs text-[#636366] dark:text-[#8E8E93] leading-relaxed mb-3 font-sans">
            See recent updates, feature additions, and release notes from the initial launch to today.
          </p>
          <button
            type="button"
            onClick={() => setIsChangelogOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold font-sans text-[var(--theme-primary)] bg-white dark:bg-[#1C1C1E] shadow-apple-sm hover:opacity-90 transition active:scale-95 flex items-center justify-center gap-1.5 border-0"
          >
            <HugeiconsIcon icon={SparklesIcon} size={14} />
            <span>View Release History</span>
          </button>
        </div>

        {/* Section 6: Add to Homescreen Instructions */}
        <div className="bg-[#F8F8FA] dark:bg-[#222226] p-4 rounded-2xl lg:rounded-xl border-0 shadow-apple-sm">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
            <div className="w-7 h-7 rounded-lg bg-[var(--theme-tint)] flex items-center justify-center text-[var(--theme-primary)]">
              <HugeiconsIcon icon={SmartPhone01Icon} size={15} />
            </div>
            <span className="font-heading font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white">
              Save to Homescreen
            </span>
          </div>
          <p className="text-xs text-[#636366] dark:text-[#8E8E93] leading-relaxed mb-3 font-sans">
            Install WhatGift on your iPhone or Android phone for instant 1-tap app access without browser address bars:
          </p>
          <div className="space-y-2 text-xs text-[#1C1C1E] dark:text-white bg-white dark:bg-[#161618] p-3 rounded-xl lg:rounded-lg border-0 shadow-apple-sm">
            <div className="flex items-start gap-2">
              <span className="font-bold shrink-0 text-[var(--theme-primary)]">iPhone / Safari:</span>
              <span>Tap the <HugeiconsIcon icon={Share01Icon} size={13} className="inline mx-0.5 text-[#007AFF]" /> <strong>Share</strong> button at bottom &rarr; tap <strong>"Add to Home Screen"</strong>.</span>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-[#E5E5EA] dark:border-[#222226]">
              <span className="font-bold shrink-0 text-[var(--theme-primary)]">Android / Chrome:</span>
              <span>Tap the <strong>⋮ Menu</strong> at top right &rarr; tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
            </div>
            {family?.code && (
              <div className="pt-1.5 border-t border-[#E5E5EA] dark:border-[#222226] text-[11px] text-[var(--theme-primary)] font-semibold flex items-center gap-1.5">
                <span>✓ Family Code ({family.code}) will be preserved automatically when launched from your homescreen.</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 7: Sign Out (Leave family is safely in Settings under Danger Zone) */}
        <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#222226] flex items-center justify-between shrink-0 pb-1">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl lg:rounded-lg text-xs font-semibold text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition font-sans active:scale-95"
          >
            <HugeiconsIcon icon={Logout01Icon} size={15} />
            <span>Sign Out</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl lg:rounded-lg text-xs font-bold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F8F8FA] dark:hover:bg-[#222226] transition font-sans active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>

    {/* Changelog Modal */}
    <ChangelogModal
      isOpen={isChangelogOpen}
      onClose={() => setIsChangelogOpen(false)}
    />
  </>
  );
}
