import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { getThemeAvatars } from '../constants/avatars';
import { CHANGELOG_RELEASES } from '../constants/changelog';
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
  const { theme, themeId, setThemeId, themes, darkMode, setDarkMode, uiScale, setUiScale, seasonalAtmosphere, setSeasonalAtmosphere, isChristmasTheme, christmasDays } = useTheme();
  const { hapticsEnabled, toggleHaptics, triggerSelection, triggerSuccess, triggerWarning } = useHaptics();

  // Active macOS settings section: 'profile' | 'family' | 'customisation' | 'about'
  const [activeSection, setActiveSection] = useState('profile');

  const [alias, setAlias] = useState('');
  const [avatar, setAvatar] = useState('🎁');
  const [submitting, setSubmitting] = useState(false);
  const [savingDeletion, setSavingDeletion] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
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

  const SECTIONS = [
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      badge: isAdmin ? 'Admin' : null,
    },
    {
      id: 'family',
      label: 'Family Circle',
      icon: UserGroupIcon,
      badge: family?.code || null,
    },
    {
      id: 'customisation',
      label: 'Customisation',
      icon: PaintBoardIcon,
      badge: themes.find((t) => t.id === themeId)?.name || null,
    },
    {
      id: 'about',
      label: 'About WhatGift',
      icon: SparklesIcon,
      badge: 'v0.4.0',
    },
  ];

  return (
    <div className="w-full space-y-6 animate-tab-fade pb-16">
      {/* Top Header */}
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
        <div className="flex items-center gap-2 p-3.5 text-xs sm:text-sm rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3.5 text-xs sm:text-sm rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 text-[#1B8036] dark:text-[#30D158]">
          <HugeiconsIcon icon={Tick02Icon} size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* MOBILE ONLY: Horizontal Category Pill Selector */}
      <div className="md:hidden flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {SECTIONS.map((sec) => {
          const isSelected = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                triggerSelection();
                setActiveSection(sec.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border-0 shrink-0 ${
                isSelected
                  ? 'bg-[var(--theme-primary)] text-white shadow-apple-sm'
                  : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
              }`}
            >
              <HugeiconsIcon icon={sec.icon} size={15} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* macOS SYSTEM SETTINGS TWO-PANE LAYOUT */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT PANE: System Settings Category Sidebar               */}
        {/* ========================================================= */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-white dark:bg-[#242526] rounded-2xl p-3 shadow-apple-sm space-y-3 sticky top-6">
          {/* User Account Tile */}
          <div className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-white dark:bg-[#242526] shadow-sm flex items-center justify-center text-2xl shrink-0">
              {user?.avatar || '🎁'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] truncate">
                {user?.alias}
              </div>
              <div className="text-xs text-[#65676B] dark:text-[#B0B3B8] truncate">
                {family?.name}
              </div>
            </div>
            {isAdmin && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                Admin
              </span>
            )}
          </div>

          {/* Category Navigation Items */}
          <nav className="space-y-1">
            {SECTIONS.map((sec) => {
              const isSelected = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    triggerSelection();
                    setActiveSection(sec.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left border-0 ${
                    isSelected
                      ? 'bg-[var(--theme-primary)] text-white shadow-apple-sm font-semibold'
                      : 'hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                      }`}
                    >
                      <HugeiconsIcon icon={sec.icon} size={15} />
                    </span>
                    <span className="text-sm truncate">{sec.label}</span>
                  </div>

                  {sec.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[85px] ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#65676B] dark:text-[#B0B3B8]'
                      }`}
                    >
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT PANE: Selected Category Detail View                 */}
        {/* ========================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-5">
          {/* 1. PROFILE SECTION */}
          {activeSection === 'profile' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-5 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB]">
                    Profile & Login Name
                  </h2>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                    Customize how your avatar and nickname appear to family members
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                  {isAdmin ? 'Family Admin' : 'Member'}
                </span>
              </div>

              <form onSubmit={handleSubmitProfile} className="space-y-4">
                {/* Avatar Preview & Selection */}
                <div>
                  <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-2">
                    Profile Picture / Emoji
                  </label>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#242526] shadow-sm flex items-center justify-center text-2xl shrink-0">
                      {avatar}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] block">
                        Selected Avatar: {avatar}
                      </span>
                      <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8]">
                        Shown on your wishlist card and header.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2.5 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-xl max-h-48 overflow-y-auto">
                    {getThemeAvatars(themeId, seasonalAtmosphere).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setAvatar(emoji);
                          triggerSelection();
                        }}
                        className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition border-0 ${
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
                  <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                    First Name / Login Name <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] transition focus:outline-none"
                  />
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-1.5">
                    This first name is how you sign into {family?.name || 'your family'}.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !alias.trim()}
                    className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition disabled:opacity-50 border-0 shadow-apple-sm active:scale-95"
                  >
                    {submitting ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. FAMILY CIRCLE SECTION */}
          {activeSection === 'family' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <div>
                    <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB]">
                      Family Circle
                    </h2>
                    <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                      Information and permissions for {family?.name}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]">
                    {family?.code}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] block">Family Group</span>
                      <span className="font-semibold text-base text-[#050505] dark:text-[#E4E6EB]">
                        {family?.name || 'My Family'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copyFamilyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#242526] text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] transition border-0 shadow-apple-sm"
                    >
                      <HugeiconsIcon icon={copiedCode ? Tick02Icon : Copy01Icon} size={14} />
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  {/* Family Deletion Setting */}
                  <div className="pt-3 border-t border-[#E4E6EB] dark:border-[#3A3B3C]">
                    {isAdmin ? (
                      <label className="flex items-center justify-between cursor-pointer py-1">
                        <div>
                          <span className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] block">
                            Allow Wishlist Item Deletion
                          </span>
                          <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-tight block mt-0.5">
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
                          <div className="w-11 h-6 bg-[#E4E6EB] dark:bg-[#4E4F50] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-primary)]" />
                        </div>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <span className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] block">
                            Wishlist Item Deletion
                          </span>
                          <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] block mt-0.5">
                            {family?.allow_item_deletion !== false
                              ? 'Enabled for this family'
                              : 'Disabled in family settings'}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            family?.allow_item_deletion !== false
                              ? 'bg-[#34C759]/15 text-[#34C759]'
                              : 'bg-[#FF9500]/15 text-[#FF9500]'
                          }`}
                        >
                          {family?.allow_item_deletion !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="flex-1 h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-xs font-semibold bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] text-[#050505] dark:text-[#E4E6EB] transition border-0 active:scale-95"
                    >
                      <HugeiconsIcon icon={copiedLink ? Tick02Icon : Link01Icon} size={15} />
                      <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
                    </button>

                    {isAdmin && onOpenAdmin && (
                      <button
                        type="button"
                        onClick={onOpenAdmin}
                        className="h-11 inline-flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] text-white transition border-0 shadow-apple-sm active:scale-95"
                      >
                        <HugeiconsIcon icon={UserSettings01Icon} size={15} />
                        <span>Manage Family</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Danger Zone: Leave Family */}
              <div className="rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm overflow-hidden">
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
                      <span className="text-sm font-semibold text-[#65676B] dark:text-[#B0B3B8] block">Danger Zone</span>
                      <span className="text-[11px] text-[#65676B]/70 dark:text-[#B0B3B8]/70">Leave or disconnect from this circle</span>
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
                      <span className="text-sm font-semibold text-[#FF3B30] block">Leave {family?.name || 'Family'}</span>
                      <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-relaxed block mt-0.5">
                        You will be signed out and disconnected from this circle. To rejoin later, you will need the family code.
                      </span>
                    </div>

                    {!confirmLeave ? (
                      <button
                        type="button"
                        onClick={() => setConfirmLeave(true)}
                        className="h-11 inline-flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 transition border-0 active:scale-95"
                      >
                        <HugeiconsIcon icon={Logout01Icon} size={15} />
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
                          className="h-11 inline-flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#FF3B30] hover:bg-[#D32F2F] transition border-0 shadow-apple-sm active:scale-95"
                        >
                          <HugeiconsIcon icon={Logout01Icon} size={15} />
                          <span>Confirm & Leave</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmLeave(false)}
                          className="h-11 px-4 rounded-xl text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] hover:text-[#050505] dark:hover:text-white transition border-0 bg-transparent"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. CUSTOMISATION SECTION (APPEARANCE + THEMES + TACTILE & HAPTICS) */}
          {activeSection === 'customisation' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Theme Palette Picker */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <div>
                    <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB]">
                      Color Theme & Occasions
                    </h2>
                    <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                      Tailored accents, navigation tint, and festive atmosphere
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8]">
                    {themes.find((t) => t.id === themeId)?.name || 'Theme'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                        className={`p-3.5 rounded-xl text-left border-0 transition flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                          isSelected
                            ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] ring-2 ring-[var(--theme-primary)] shadow-sm'
                            : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-sm text-[#050505] dark:text-[#E4E6EB]">
                            {t.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center">
                              <HugeiconsIcon icon={Tick02Icon} size={11} />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] truncate">{t.holiday}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {t.gradient ? (
                              <span
                                className="w-4 h-4 rounded-full shadow-sm"
                                style={{ background: t.gradient }}
                              />
                            ) : (
                              <span
                                className="w-4 h-4 rounded-full shadow-sm"
                                style={{ backgroundColor: t.primary }}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Christmas & Holiday Atmosphere Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <div>
                    <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                      <span>{seasonalAtmosphere === 'sun' ? '☀️' : '❄️'}</span>
                      <span>Holiday Climate & Atmosphere</span>
                    </h2>
                    <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                      Choose between Northern Hemisphere snowfall or an Australian warm summer Christmas
                    </p>
                  </div>
                  {isChristmasTheme && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                      {christmasDays === 0 ? 'Merry Christmas!' : `${christmasDays} days to Christmas`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-xl">
                  {[
                    {
                      id: 'snow',
                      label: 'Winter Snow',
                      icon: '❄️',
                      desc: 'Gentle falling snowflakes',
                    },
                    {
                      id: 'sun',
                      label: 'Aussie Summer',
                      icon: '☀️',
                      desc: 'Golden sunbeams & summer shimmer',
                    },
                    {
                      id: 'off',
                      label: 'Minimal (Off)',
                      icon: '🚫',
                      desc: 'Clean interface with no particles',
                    },
                  ].map((opt) => {
                    const isSelected = seasonalAtmosphere === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSeasonalAtmosphere(opt.id);
                          triggerSelection();
                        }}
                        className={`p-3 rounded-lg border-0 text-left transition flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-white dark:bg-[#242526] shadow-sm'
                            : 'hover:bg-white/50 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{opt.icon}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center">
                              <HugeiconsIcon icon={Tick02Icon} size={11} />
                            </span>
                          )}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${isSelected ? 'text-[var(--theme-primary)]' : 'text-[#050505] dark:text-[#E4E6EB]'}`}>
                            {opt.label}
                          </span>
                          <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] leading-tight block mt-0.5">
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dark Mode & UI Scaling */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
                <div className="pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB]">
                    Appearance Mode & Interface Scaling
                  </h2>
                </div>

                {/* Dark Mode Segmented Controls */}
                <div>
                  <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-2">
                    Appearance Mode
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-xl">
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
                          className={`h-11 rounded-lg border-0 flex items-center justify-center gap-1.5 transition text-xs font-semibold ${
                            isSelected
                              ? 'bg-white dark:bg-[#242526] text-[var(--theme-primary)] shadow-sm'
                              : 'text-[#65676B] dark:text-[#B0B3B8] hover:text-[#050505] dark:hover:text-white'
                          }`}
                        >
                          <HugeiconsIcon icon={IconComponent} size={16} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop UI Scaling Control */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-1.5">
                      <HugeiconsIcon icon={ALargeSmallIcon} size={16} className="text-[var(--theme-primary)]" />
                      <span>Desktop Interface Scaling</span>
                    </label>
                    <span className="text-xs font-medium text-[#65676B] dark:text-[#B0B3B8] hidden lg:inline">
                      {uiScale === 'compact' ? 'Compact (88%)' : uiScale === 'default' ? 'Default (100%)' : uiScale === 'spacious' ? 'Spacious (110%)' : 'Large (120%)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-xl">
                    {[
                      { id: 'compact', label: 'Compact', desc: '88%' },
                      { id: 'default', label: 'Default', desc: '100%' },
                      { id: 'spacious', label: 'Spacious', desc: '110%' },
                      { id: 'large', label: 'Large', desc: '120%' },
                    ].map(({ id, label, desc }) => {
                      const isSelected = uiScale === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setUiScale(id);
                            triggerSelection();
                          }}
                          className={`h-12 px-1 rounded-lg border-0 flex flex-col items-center justify-center transition ${
                            isSelected
                              ? 'bg-white dark:bg-[#242526] text-[var(--theme-primary)] shadow-sm font-semibold'
                              : 'text-[#65676B] dark:text-[#B0B3B8] hover:text-[#050505] dark:hover:text-white font-medium'
                          }`}
                        >
                          <span className="text-xs">{label}</span>
                          <span className="text-[10px] opacity-75">{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tactile & Vibration Feedback (Merged) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
                <div className="pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB]">
                    Tactile & Vibration Feedback
                  </h2>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                    Physical click feedback on supported mobile devices and browsers
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-tint)] text-[var(--theme-primary)] flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={SmartPhone01Icon} size={20} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] block">
                        Web Haptic Vibrations
                      </span>
                      <span className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
                        Delivers tactile clicks when selecting tabs, claiming gifts, or confirming actions
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleHaptics}
                    className={`w-11 h-6 rounded-full transition-colors relative border-0 p-0.5 shrink-0 ${
                      hapticsEnabled ? 'bg-[#34C759]' : 'bg-[#CCD0D5] dark:bg-[#4E4F50]'
                    }`}
                    aria-label="Toggle haptic feedback"
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. ABOUT SECTION (UNWRAPPED WITH INLINE CHANGELOG) */}
          {activeSection === 'about' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* App Identity Banner */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <div>
                    <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB]">
                      About WhatGift
                    </h2>
                    <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                      Secret family gift exchange & anti-spoiler wishlist coordination
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                    v0.4.0
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--theme-primary)] text-white flex items-center justify-center text-2xl shrink-0 shadow-apple-sm">
                    🎁
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#050505] dark:text-[#E4E6EB]">
                        WhatGift
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-primary)] text-white">
                        Latest
                      </span>
                    </div>
                    <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-1 leading-relaxed">
                      Crafted for families to share wishlists, coordinate secret gift reservations, and celebrate holidays together without spoiling surprises.
                    </p>
                  </div>
                </div>
              </div>

              {/* What's New & Release Highlights (Unwrapped directly on the page) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-6">
                <div className="pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <h3 className="text-base font-semibold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                    <HugeiconsIcon icon={SparklesIcon} size={18} className="text-[var(--theme-primary)]" />
                    <span>What's New & Release Highlights</span>
                  </h3>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                    Feature additions, safeguards, and interface improvements
                  </p>
                </div>

                <div className="space-y-6">
                  {CHANGELOG_RELEASES.map((rel, idx) => (
                    <div
                      key={rel.version}
                      className={`space-y-3.5 ${
                        idx !== 0 ? 'pt-6 border-t border-[#E4E6EB] dark:border-[#3A3B3C]' : ''
                      }`}
                    >
                      {/* Version Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB]">
                            {rel.version}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rel.tagColor}`}>
                            {rel.tag}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8]">
                        {rel.title}
                      </div>

                      {/* Feature Items */}
                      <div className="space-y-2.5">
                        {rel.highlights.map((feat) => (
                          <div
                            key={feat.title}
                            className="p-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-start gap-3"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] flex items-center justify-center shrink-0 mt-0.5">
                              <HugeiconsIcon icon={feat.icon} size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-[#050505] dark:text-[#E4E6EB]">
                                {feat.title}
                              </h4>
                              <p className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] mt-0.5 leading-relaxed">
                                {feat.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
