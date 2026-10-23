import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { AVATAR_OPTIONS } from '../constants/avatars';
import ChangelogModal from './ChangelogModal';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserIcon,
  PaintBoardIcon,
  SmartPhone01Icon,
  Logout01Icon,
  Tick02Icon,
  AlertCircleIcon,
  Sun01Icon,
  Moon02Icon,
  ComputerIcon,
  SparklesIcon,
  UserGroupIcon,
  Copy01Icon,
  Link01Icon,
  UserSettings01Icon,
  ArrowDown01Icon,
  ALargeSmallIcon,
} from '@hugeicons/core-free-icons';

export default function SettingsView({ onOpenAdmin }) {
  const { user, family, isAdmin, updateUserProfile, updateFamilyDetails, logout } = useAuth();
  const { theme, themeId, setThemeId, themes, darkMode, setDarkMode, uiScale, setUiScale } = useTheme();
  const { hapticsEnabled, toggleHaptics, triggerSelection, triggerSuccess, triggerWarning } = useHaptics();

  const [alias, setAlias] = useState('');
  const [avatar, setAvatar] = useState('🎁');
  const [submitting, setSubmitting] = useState(false);
  const [savingDeletion, setSavingDeletion] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (user) {
      setAlias(user.alias || '');
      setAvatar(user.avatar || '🎁');
    }
  }, [user]);

  const handleSubmitProfile = async (e) => {
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

  const handleToggleDeletion = async (e) => {
    const nextVal = e.target.checked;
    setSavingDeletion(true);
    setError('');
    setSuccess('');
    try {
      await updateFamilyDetails({ allow_item_deletion: nextVal });
      triggerSuccess?.();
      setSuccess(
        nextVal
          ? 'Wishlist item deletion is now enabled for all family members.'
          : 'Wishlist item deletion has been turned off for the family.'
      );
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      triggerWarning?.();
      setError(err.message || 'Failed to update item deletion setting');
    } finally {
      setSavingDeletion(false);
    }
  };

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

  return (
    <div className="w-full space-y-6 animate-tab-fade pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
            Manage your personal profile, festive appearance themes, and family circle details
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 text-xs sm:text-sm rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3.5 text-xs sm:text-sm rounded-lg bg-[#34C759]/10 border border-[#34C759]/20 text-[#1B8036] dark:text-[#30D158]">
          <HugeiconsIcon icon={Tick02Icon} size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Two-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols on lg): User Profile & Family Identity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: User Profile & Login Details */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={UserIcon} size={18} className="text-[var(--theme-primary)]" />
                Your Profile Details
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                {isAdmin ? 'Family Admin' : 'Member'}
              </span>
            </div>

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {/* Avatar Preview & Selection */}
              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] mb-3">
                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-[#242526] shadow-sm flex items-center justify-center text-2xl shrink-0">
                    {avatar}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#050505] dark:text-[#E4E6EB] block">
                      Active Profile Picture: {avatar}
                    </span>
                    <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8]">
                      Used by family members to identify your wishlist.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-2 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg max-h-48 overflow-y-auto">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setAvatar(emoji);
                        triggerSelection();
                      }}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition border-0 ${
                        avatar === emoji
                          ? 'bg-white dark:bg-[#242526] ring-2 ring-[var(--theme-primary)] shadow-sm scale-105'
                          : 'hover:bg-white/60 dark:hover:bg-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name / Alias Input */}
              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5 flex items-center">
                  <span>First Name / Login Name</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FF3B30]/10 text-[#FF3B30] ml-1.5">
                    Required
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] transition"
                />
                <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-1.5">
                  This first name is how you sign into {family?.name || 'your family'}.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting || !alias.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition disabled:opacity-50 border-0"
                >
                  {submitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Family Circle Coordination */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-[var(--theme-primary)]" />
                Family Circle
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]">
                {family?.code}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] block">Family Group</span>
                  <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB]">
                    {family?.name || 'My Family'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyFamilyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#242526] text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] transition border-0 shadow-apple-xs"
                >
                  <HugeiconsIcon icon={copiedCode ? Tick02Icon : Copy01Icon} size={14} />
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Family Deletion Setting */}
              <div className="pt-2 border-t border-[#E4E6EB] dark:border-[#3A3B3C]">
                {isAdmin ? (
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <div>
                      <span className="text-xs font-bold text-[#050505] dark:text-[#E4E6EB] block">
                        Allow Wishlist Item Deletion
                      </span>
                      <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] leading-tight block mt-0.5">
                        Allow members to delete items from their wishlists
                      </span>
                    </div>
                    <div className="relative inline-flex items-center ml-3 shrink-0">
                      <input
                        type="checkbox"
                        checked={family?.allow_item_deletion !== false}
                        onChange={handleToggleDeletion}
                        disabled={savingDeletion}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-[#CCD0D5] dark:bg-[#4E4F50] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-primary)]" />
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-xs font-bold text-[#050505] dark:text-[#E4E6EB] block">
                        Wishlist Item Deletion
                      </span>
                      <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] block mt-0.5">
                        {family?.allow_item_deletion !== false
                          ? 'Enabled for this family'
                          : 'Disabled in family settings'}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        family?.allow_item_deletion !== false
                          ? 'bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158]'
                          : 'bg-[#FF9500]/10 text-[#FF9500]'
                      }`}
                    >
                      {family?.allow_item_deletion !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] text-[#050505] dark:text-[#E4E6EB] transition border-0"
                >
                  <HugeiconsIcon icon={copiedLink ? Tick02Icon : Link01Icon} size={15} />
                  <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
                </button>

                {isAdmin && onOpenAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] text-white transition border-0"
                  >
                    <HugeiconsIcon icon={UserSettings01Icon} size={15} />
                    <span>Manage Family</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone: Leave Family (Matching card design) */}
          <div className="rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setShowDangerZone(!showDangerZone);
                setConfirmLeave(false);
              }}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition border-0 bg-transparent"
            >
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-[#65676B] dark:text-[#B0B3B8]" />
                <div>
                  <span className="text-xs font-bold text-[#65676B] dark:text-[#B0B3B8] block">Danger Zone</span>
                  <span className="text-[11px] text-[#65676B]/70 dark:text-[#B0B3B8]/70">Advanced circle membership options</span>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                className={`text-[#65676B] dark:text-[#B0B3B8] transition-transform duration-200 ${showDangerZone ? 'rotate-180' : ''}`}
              />
            </button>

            {showDangerZone && (
              <div className="p-4 border-t border-[#E4E6EB] dark:border-[#3A3B3C] bg-[#FF3B30]/5 space-y-3">
                <div>
                  <span className="text-xs font-bold text-[#FF3B30] block">Leave {family?.name || 'Family'}</span>
                  <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] leading-relaxed block mt-0.5">
                    You will be signed out and disconnected from this circle. To rejoin later, you will need the family code.
                  </span>
                </div>

                {!confirmLeave ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLeave(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 transition border-0"
                  >
                    <HugeiconsIcon icon={Logout01Icon} size={13} />
                    <span>Leave Family Circle...</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('whatgift_last_family_code');
                        logout();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#FF3B30] hover:bg-[#D32F2F] transition border-0"
                    >
                      <HugeiconsIcon icon={Logout01Icon} size={13} />
                      <span>Confirm & Leave</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLeave(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] hover:text-[#050505] dark:hover:text-white transition border-0 bg-transparent"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols on lg): Appearance, Themes, and App Preferences */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 3: Festive & Everyday Themes Palette Picker */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={PaintBoardIcon} size={18} className="text-[var(--theme-primary)]" />
                Color Theme & Occasions
              </span>
              <span className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8]">
                {themes.find((t) => t.id === themeId)?.name || 'Theme'}
              </span>
            </div>

            <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-relaxed">
              Select an accent theme tailored to the occasion. Themes adjust navigation accents, claim badges, and selection highlights.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {themes.map((t) => {
                const isSelected = themeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setThemeId(t.id);
                      triggerSelection();
                    }}
                    className={`p-3 rounded-lg text-left border-0 transition flex flex-col justify-between gap-2 relative overflow-hidden ${
                      isSelected
                        ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] ring-2 ring-[var(--theme-primary)]'
                        : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.emoji}</span>
                        <div>
                          <span className="font-bold text-xs text-[#050505] dark:text-[#E4E6EB] block">
                            {t.name}
                          </span>
                          <span className="text-[10px] text-[#65676B] dark:text-[#B0B3B8]">
                            {t.subtitle}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <HugeiconsIcon icon={Tick02Icon} size={14} className="text-[var(--theme-primary)] shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <div
                        className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                        style={{ backgroundColor: t.primary }}
                      />
                      {t.secondary && (
                        <div
                          className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                          style={{ backgroundColor: t.secondary }}
                        />
                      )}
                      <span className="text-[10px] text-[#65676B] dark:text-[#B0B3B8] ml-1">
                        {t.isFestive ? 'Special occasion' : 'Year-round'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 4: Dark Mode & Appearance Preferences */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={Sun01Icon} size={18} className="text-[var(--theme-primary)]" />
                Display & Night Mode
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDarkMode('light');
                  triggerSelection();
                }}
                className={`py-3 px-3 rounded-lg text-xs font-semibold border-0 transition flex flex-col items-center gap-2 ${
                  darkMode === 'light'
                    ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)] font-bold'
                    : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50]'
                }`}
              >
                <HugeiconsIcon icon={Sun01Icon} size={18} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDarkMode('dark');
                  triggerSelection();
                }}
                className={`py-3 px-3 rounded-lg text-xs font-semibold border-0 transition flex flex-col items-center gap-2 ${
                  darkMode === 'dark'
                    ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)] font-bold'
                    : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50]'
                }`}
              >
                <HugeiconsIcon icon={Moon02Icon} size={18} />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDarkMode('system');
                  triggerSelection();
                }}
                className={`py-3 px-3 rounded-lg text-xs font-semibold border-0 transition flex flex-col items-center gap-2 ${
                  darkMode === 'system'
                    ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)] font-bold'
                    : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50]'
                }`}
              >
                <HugeiconsIcon icon={ComputerIcon} size={18} />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Card 5: Accessibility Scaling */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={ALargeSmallIcon} size={18} className="text-[var(--theme-primary)]" />
                Text Size & Scaling
              </span>
              <span className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] capitalize">
                {uiScale} Scale
              </span>
            </div>

            <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
              Adjust text and card sizing for maximum readability on your screen.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {['compact', 'default', 'large'].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => {
                    setUiScale(scale);
                    triggerSelection();
                  }}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border-0 transition capitalize ${
                    uiScale === scale
                      ? 'bg-[var(--theme-primary)] text-white shadow-sm font-bold'
                      : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50]'
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>

          {/* Card 6: Haptic Feedback Switch */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={SmartPhone01Icon} size={18} className="text-[var(--theme-primary)]" />
                Vibration & Haptic Clicks
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hapticsEnabled}
                  onChange={toggleHaptics}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#CCD0D5] dark:bg-[#4E4F50] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-primary)]" />
              </label>
            </div>
            <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-relaxed">
              Provides subtle physical tactile feedback when tapping items, claiming gifts, or switching themes on supported mobile devices.
            </p>
          </div>

          {/* Card 7: Version Info & Changelog */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#050505] dark:text-[#E4E6EB] block">
                WhatGift v0.3.0
              </span>
              <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8]">
                Made with care for multi-generational families
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              className="text-xs font-semibold text-[var(--theme-primary)] hover:underline border-0 bg-transparent"
            >
              What's New
            </button>
          </div>
        </div>
      </div>

      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
    </div>
  );
}
