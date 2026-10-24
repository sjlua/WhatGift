import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Delete02Icon,
  Tick02Icon,
  AlertCircleIcon,
  Link01Icon,
  UserSettings01Icon,
  CircleQuestionMarkIcon,
  UserGroupIcon,
  Cancel01Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';
import ConfirmDialog from './ConfirmDialog';

const AVATAR_OPTIONS = [
  '🎁', '🎄', '🎅', '🤶', '⭐', '❄️', '🦌', '⛄',
  '🌟', '🔔', '🕯️', '🍪', '✨', '🎉', '🎈', '🎂',
  '🎀', '👑', '💖', '🦄', '🐶', '🐱', '🦊', '🐻',
];

export default function AdminView({ onWishlistReset, onOpenSetupHelp }) {
  const { family, updateFamilyDetails, refreshFamily, logout } = useAuth();
  const { theme } = useTheme();
  const { triggerSuccess, triggerWarning, triggerSelection } = useHaptics();

  // Active macOS settings section: 'members' | 'settings' | 'danger'
  const [activeSection, setActiveSection] = useState('members');

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Member deletion confirmation state
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deletingMember, setDeletingMember] = useState(false);

  // Family details form
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [allowItemDeletion, setAllowItemDeletion] = useState(true);
  const [savingFamily, setSavingFamily] = useState(false);
  const [familySuccess, setFamilySuccess] = useState('');
  const [familyError, setFamilyError] = useState('');

  // Member management
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Add member section toggle & form
  const [showAddMember, setShowAddMember] = useState(false);
  const [alias, setAlias] = useState('');
  const [avatar, setAvatar] = useState('🎁');
  const [submitting, setSubmitting] = useState(false);

  const inviteUrl = `${window.location.origin}/?family=${encodeURIComponent(family?.code || '')}`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    triggerSuccess?.();
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await api.getMembers();
      setMembers(data);
    } catch (err) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    setError('');
    setSuccess('');
    setResetSuccess('');
    setResetError('');
    setShowResetConfirm(false);
    setCopiedInvite(false);
    if (family) {
      setFamilyName(family.name || '');
      setFamilyCode(family.code || '');
      setAllowItemDeletion(family.allow_item_deletion !== false);
      setFamilyError('');
      setFamilySuccess('');
    }
  }, [family]);

  const handleConfirmResetWishlist = async () => {
    try {
      setResetting(true);
      setResetError('');
      const res = await api.resetWishlist();
      triggerSuccess?.();
      setResetSuccess(res.message || 'All family wishlist items have been permanently deleted.');
      setShowResetConfirm(false);
      onWishlistReset?.();
      refreshFamily?.();
    } catch (err) {
      triggerWarning?.();
      setResetError(err.message || 'Failed to reset family wishlist.');
    } finally {
      setResetting(false);
    }
  };

  // Track if admin modified family details
  const isCodeModified = familyCode.trim().toUpperCase() !== (family?.code || '').toUpperCase();
  const isNameModified = familyName.trim() !== (family?.name || '');
  const isDeletionModified = allowItemDeletion !== (family?.allow_item_deletion !== false);
  const hasFamilyChanges = isCodeModified || isNameModified || isDeletionModified;

  const handleSaveFamily = async (e) => {
    e.preventDefault();
    const cleanName = familyName.trim();
    if (!cleanName) {
      setFamilyError('Family name cannot be blank.');
      triggerWarning?.();
      return;
    }

    const cleanCode = familyCode.trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
    if (cleanCode.length < 2) {
      setFamilyError('Family code must be at least 2 alphanumeric characters.');
      triggerWarning?.();
      return;
    }

    setSavingFamily(true);
    setFamilyError('');
    setFamilySuccess('');

    try {
      const codeWillChange = cleanCode !== (family?.code || '').toUpperCase();
      const res = await updateFamilyDetails({
        name: cleanName,
        code: cleanCode,
        allow_item_deletion: allowItemDeletion,
      });

      if (codeWillChange || res.code_changed) {
        triggerSuccess?.();
        setFamilySuccess(`Family code updated to "${cleanCode}"! Logging you out to save and apply changes...`);
        localStorage.setItem('whatgift_last_family_code', cleanCode);
        setTimeout(() => {
          logout();
          window.location.href = `/?family=${encodeURIComponent(cleanCode)}`;
        }, 1200);
      } else {
        triggerSuccess?.();
        setFamilySuccess('Family settings updated successfully!');
        await refreshFamily();
        setTimeout(() => setFamilySuccess(''), 3000);
      }
    } catch (err) {
      setFamilyError(err.message || 'Failed to update family details');
      triggerWarning?.();
    } finally {
      setSavingFamily(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!alias.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.createMember({
        alias: alias.trim(),
        avatar: avatar || '🎁',
      });
      triggerSuccess?.();
      setSuccess(`Added "${alias.trim()}" to the family!`);
      setAlias('');
      setAvatar('🎁');
      setShowAddMember(false);
      await loadMembers();
      await refreshFamily();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create family member');
      triggerWarning?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (memberId, memberAlias) => {
    triggerWarning?.();
    setMemberToDelete({ id: memberId, alias: memberAlias });
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeletingMember(true);
    try {
      await api.deleteMember(memberToDelete.id);
      triggerSuccess?.();
      setSuccess(`Removed "${memberToDelete.alias}"`);
      setMemberToDelete(null);
      await loadMembers();
      await refreshFamily();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'Failed to delete member');
      triggerWarning?.();
    } finally {
      setDeletingMember(false);
    }
  };

  const SECTIONS = [
    {
      id: 'members',
      label: 'Family Roster',
      icon: UserGroupIcon,
      badge: `${members.length}`,
    },
    {
      id: 'settings',
      label: 'Circle Settings & Invites',
      icon: Settings02Icon,
      badge: family?.code || null,
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: AlertCircleIcon,
      badge: 'Reset',
      destructive: true,
    },
  ];

  return (
    <div className="w-full space-y-6 animate-tab-fade pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight flex items-center gap-2">
            <span>Manage Family & Members</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
              Admin
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
            Admin controls for family membership, invite links, and wishlist settings
          </p>
        </div>

        {onOpenSetupHelp && (
          <button
            type="button"
            onClick={onOpenSetupHelp}
            className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] transition border-0 active:scale-95 shrink-0"
            title="How to Setup Guide"
          >
            <HugeiconsIcon icon={CircleQuestionMarkIcon} size={16} className="text-[var(--theme-primary)]" />
            <span>How to Setup</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 text-sm rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3.5 text-sm rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 text-[#1B8036] dark:text-[#30D158]">
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
                  ? sec.destructive
                    ? 'bg-[#FF3B30] text-white shadow-apple-sm'
                    : 'bg-[var(--theme-primary)] text-white shadow-apple-sm'
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
        {/* LEFT PANE: Admin Category Navigation Sidebar              */}
        {/* ========================================================= */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-white dark:bg-[#242526] rounded-2xl p-3 shadow-apple-sm space-y-3 sticky top-6">
          {/* Family Circle Info Tile */}
          <div className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-white dark:bg-[#242526] shadow-sm flex items-center justify-center text-2xl shrink-0">
              👥
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] truncate">
                {family?.name || 'Family Circle'}
              </div>
              <div className="text-xs font-mono text-[#65676B] dark:text-[#B0B3B8] truncate">
                Code: {family?.code}
              </div>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
              Admin
            </span>
          </div>

          {/* Navigation Items */}
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
                      ? sec.destructive
                        ? 'bg-[#FF3B30] text-white shadow-apple-sm font-semibold'
                        : 'bg-[var(--theme-primary)] text-white shadow-apple-sm font-semibold'
                      : sec.destructive
                      ? 'hover:bg-[#FF3B30]/10 text-[#FF3B30] font-medium'
                      : 'hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : sec.destructive
                          ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
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
                          : sec.destructive
                          ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
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
        {/* RIGHT PANE: Selected Admin Category Detail View           */}
        {/* ========================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-5">
          {/* 1. FAMILY ROSTER & MEMBERS */}
          {activeSection === 'members' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                <div>
                  <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB]">
                    Family Roster
                  </h2>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                    {members.length} {members.length === 1 ? 'member' : 'members'} enrolled in {family?.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerSelection?.();
                    setShowAddMember(!showAddMember);
                  }}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition border-0 active:scale-95 ${
                    showAddMember
                      ? 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                      : 'bg-[var(--theme-primary)] text-white shadow-apple-sm'
                  }`}
                >
                  {showAddMember ? (
                    <>
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Add01Icon} size={14} />
                      <span>Add Member</span>
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible Add Member Form */}
              {showAddMember && (
                <form
                  onSubmit={handleCreateMember}
                  className="p-4 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C]/50 space-y-3.5 border border-[#E4E6EB] dark:border-[#3A3B3C] animate-in fade-in duration-200"
                >
                  <div className="font-semibold text-sm text-[#050505] dark:text-[#E4E6EB]">
                    Add New Family Member
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                      First Name / Nickname <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grandma, Uncle Joe, Sophia"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#242526] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] transition focus:outline-none shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                      Choose Member Avatar
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-[#242526] rounded-xl max-h-32 overflow-y-auto shadow-inner">
                      {AVATAR_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setAvatar(emoji)}
                          className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition border-0 ${
                            avatar === emoji
                              ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] ring-2 ring-[var(--theme-primary)] scale-105'
                              : 'hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="h-10 px-4 rounded-xl text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] hover:bg-black/5 dark:hover:bg-white/10 transition border-0"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !alias.trim()}
                      className="h-10 px-5 rounded-xl text-xs font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition border-0 disabled:opacity-50 shadow-apple-sm active:scale-95"
                    >
                      {submitting ? 'Adding...' : 'Add to Family'}
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Member List */}
              <div className="divide-y divide-[#E4E6EB] dark:divide-[#3A3B3C]">
                {loading ? (
                  <div className="py-8 text-center text-sm text-[#65676B] dark:text-[#B0B3B8]">
                    Loading family members...
                  </div>
                ) : members.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[#65676B] dark:text-[#B0B3B8]">
                    No members enrolled yet.
                  </div>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C]">
                          {m.avatar || '🎁'}
                        </span>
                        <div>
                          <div className="font-semibold text-sm text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                            <span>{m.alias}</span>
                            {m.is_admin && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5">
                            <span className="inline-flex items-center text-xs text-[#65676B] dark:text-[#B0B3B8]">
                              {m.item_count ?? 0} {m.item_count === 1 ? 'wish' : 'wishes'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!m.is_admin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(m.id, m.alias)}
                          className="w-9 h-9 flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl transition border-0"
                          title="Remove member"
                          aria-label={`Remove ${m.alias}`}
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 2. CIRCLE SETTINGS & INVITES (MERGED) */}
          {activeSection === 'settings' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Direct Invite Link Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4">
                <div className="pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                      <HugeiconsIcon icon={Link01Icon} size={18} className="text-[var(--theme-primary)]" />
                      <span>Family Invite Link & Quick Access</span>
                    </h2>
                    <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                      Share with family members to let them sign in automatically with one tap
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]">
                    {family?.code}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                      Direct Invite Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        className="flex-1 h-11 font-mono text-xs px-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] border-0 text-[#050505] dark:text-[#E4E6EB] select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className="h-11 px-4 rounded-xl text-xs font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition border-0 shrink-0 shadow-apple-sm inline-flex items-center gap-1.5 active:scale-95"
                      >
                        {copiedInvite ? (
                          <>
                            <HugeiconsIcon icon={Tick02Icon} size={14} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={Link01Icon} size={14} />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] block">Manual Join Code</span>
                      <span className="text-sm font-mono font-bold text-[var(--theme-primary)]">
                        {family?.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8]">
                      Can be typed into the login screen
                    </span>
                  </div>
                </div>
              </div>

              {/* Family Circle Settings & Permissions Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-5">
                <div className="pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                    <HugeiconsIcon icon={Settings02Icon} size={18} className="text-[var(--theme-primary)]" />
                    <span>Family Circle Settings</span>
                  </h2>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                    Update group identity and configure wishlist rules for all members
                  </p>
                </div>

                {familyError && (
                  <div className="flex items-center gap-2 p-2.5 text-xs rounded-xl bg-[#FF3B30]/10 text-[#FF3B30]">
                    <HugeiconsIcon icon={AlertCircleIcon} size={14} className="shrink-0" />
                    <span>{familyError}</span>
                  </div>
                )}

                {familySuccess && (
                  <div className="flex items-center gap-2 p-2.5 text-xs rounded-xl bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158]">
                    <HugeiconsIcon icon={Tick02Icon} size={14} className="shrink-0" />
                    <span>{familySuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveFamily} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                        Family Group Name <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder="e.g. The Miller Family"
                        className="w-full h-11 px-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] transition focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                        Family Join Code <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={familyCode}
                        onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                        placeholder="e.g. MILLER-2026"
                        className="w-full h-11 px-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] font-mono text-sm uppercase text-[#050505] dark:text-[#E4E6EB] transition focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Wishlist Item Deletion Toggle */}
                  <div className="pt-3 border-t border-[#E4E6EB] dark:border-[#3A3B3C]">
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <div>
                        <span className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] block">
                          Allow Wishlist Item Deletion
                        </span>
                        <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-tight block mt-0.5">
                          Allow family members to delete items from their wishlists
                        </span>
                      </div>
                      <div className="relative inline-flex items-center ml-3 shrink-0">
                        <input
                          type="checkbox"
                          checked={allowItemDeletion}
                          onChange={(e) => setAllowItemDeletion(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#E4E6EB] dark:bg-[#4E4F50] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-primary)]" />
                      </div>
                    </label>
                  </div>

                  {isCodeModified && (
                    <div className="p-3 rounded-xl bg-[#FF9500]/10 text-[#FF9500] text-xs flex items-start gap-2 leading-relaxed">
                      <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0 mt-0.5" />
                      <span>
                        <strong>Notice:</strong> Changing the family code will log you out to apply the update.
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingFamily || !hasFamilyChanges}
                      className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition border-0 disabled:opacity-40 shadow-apple-sm active:scale-95"
                    >
                      {savingFamily ? 'Saving Changes...' : 'Save Family Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 3. DANGER ZONE */}
          {activeSection === 'danger' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm space-y-4 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#FF3B30] flex items-center gap-2">
                    <HugeiconsIcon icon={AlertCircleIcon} size={18} />
                    <span>Danger Zone</span>
                  </h2>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                    Irreversible actions that affect all wishlists in {family?.name}
                  </p>
                </div>
                <span className="text-xs text-[#FF3B30] font-semibold px-2.5 py-0.5 rounded-full bg-[#FF3B30]/10">
                  Irreversible
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FF3B30]/5 border border-[#FF3B30]/20 space-y-3">
                <span className="text-sm font-semibold text-[#FF3B30] block">
                  Reset Entire Family Wishlist
                </span>
                <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-relaxed">
                  Permanently deletes ALL wishlist items, store links, prices, and marks across every family member in {family?.name}. Use this at the start of a new holiday season to clear previous gifts.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerWarning?.();
                      setResetError('');
                      setShowResetConfirm(true);
                    }}
                    className="h-11 px-4 rounded-xl text-sm font-semibold text-white bg-[#FF3B30] hover:bg-[#D70015] transition border-0 inline-flex items-center gap-2 shadow-apple-sm active:scale-95"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                    <span>Reset Entire Family Wishlist</span>
                  </button>
                </div>

                {resetSuccess && (
                  <div className="p-3 rounded-xl bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158] text-xs font-medium flex items-center gap-2">
                    <HugeiconsIcon icon={Tick02Icon} size={15} />
                    <span>{resetSuccess}</span>
                  </div>
                )}
                {resetError && (
                  <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium flex items-center gap-2">
                    <HugeiconsIcon icon={AlertCircleIcon} size={15} />
                    <span>{resetError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Irreversible Wishlist Reset Confirmation Modal */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmResetWishlist}
        title="Reset Entire Family Wishlist?"
        message={`Are you sure you want to permanently delete all wishlist items across all family members in ${family?.name || 'this family'}? This action is irreversible.`}
        confirmText={resetting ? 'Resetting...' : 'Yes, Reset Entire Wishlist'}
        cancelText="Cancel"
        variant="danger"
        confirmDisabled={resetting}
      />

      {/* Member Deletion Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleConfirmDeleteMember}
        title={`Remove ${memberToDelete?.alias || 'Member'}?`}
        message={`Are you sure you want to remove ${memberToDelete?.alias || 'this member'} from ${family?.name || 'the family'}? Their personal wishlist items will also be removed.`}
        confirmText={deletingMember ? 'Removing...' : 'Remove Member'}
        cancelText="Cancel"
        variant="danger"
        confirmDisabled={deletingMember}
      />
    </div>
  );
}
