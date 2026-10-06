import React, { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useHaptics } from '../context/HapticsContext';
import { AVATAR_OPTIONS } from '../constants/avatars';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserGroupIcon,
  Delete02Icon,
  Tick02Icon,
  AlertCircleIcon,
  Add01Icon,
  Link01Icon,
  Edit02Icon,
  Copy01Icon,
  UserSettings01Icon,
} from '@hugeicons/core-free-icons';

export default function AdminView({ onWishlistReset }) {
  const { family, refreshFamily, updateFamilyDetails, logout } = useAuth();
  const { triggerSuccess, triggerWarning } = useHaptics();

  // Wishlist reset state
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
  const [savingFamily, setSavingFamily] = useState(false);
  const [familySuccess, setFamilySuccess] = useState('');
  const [familyError, setFamilyError] = useState('');

  // Member management
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  // New member form
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
  const hasFamilyChanges = isCodeModified || isNameModified;

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
        setFamilySuccess(`Family name updated to "${cleanName}"!`);
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

  return (
    <div className="w-full space-y-6 animate-tab-fade pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
        <div>
          <div className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] mb-0.5 flex items-center gap-1.5">
            <HugeiconsIcon icon={UserSettings01Icon} size={14} className="text-[var(--theme-primary)]" />
            <span>Family Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight flex items-center gap-2">
            <span>Manage Family & Members</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--theme-tint)] text-[var(--theme-primary)]">
              Admin
            </span>
          </h1>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 text-sm rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3.5 text-sm rounded-lg bg-[#34C759]/10 border border-[#34C759]/20 text-[#1B8036] dark:text-[#30D158]">
          <HugeiconsIcon icon={Tick02Icon} size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Two-Column Grid for Optimal Full-Page Space Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Family Info & Direct Invite Link */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Invite Link Card */}
          <div className="p-5 rounded-xl bg-[#F0F2F5] dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={Link01Icon} size={18} className="text-[var(--theme-primary)]" />
                Family Invite Link
              </span>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="text-xs font-semibold text-[var(--theme-primary)] hover:underline border-0 bg-transparent"
              >
                {copiedInvite ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-relaxed">
              Send this link to family members. When opened, it automatically selects {family?.name} so they can sign in simply by typing their first name.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 font-mono text-xs px-3 py-2.5 rounded-lg bg-white dark:bg-[#3A3B3C] border border-[#CCD0D5] dark:border-[#4E4F50] text-[#050505] dark:text-[#E4E6EB] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition border-0 shrink-0"
              >
                {copiedInvite ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Family Name & Code Settings */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={Edit02Icon} size={18} className="text-[var(--theme-primary)]" />
                Family Circle Settings
              </span>
              <span className="text-xs text-[#65676B] dark:text-[#B0B3B8]">Admin Controls</span>
            </div>

            {familyError && (
              <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-[#FF3B30]/10 text-[#FF3B30]">
                <HugeiconsIcon icon={AlertCircleIcon} size={14} className="shrink-0" />
                <span>{familyError}</span>
              </div>
            )}

            {familySuccess && (
              <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158]">
                <HugeiconsIcon icon={Tick02Icon} size={14} className="shrink-0" />
                <span>{familySuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveFamily} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                  Family Group Name <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. The Miller Family"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                  Family Join Code <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MILLER-2026"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] font-mono text-sm uppercase text-[#050505] dark:text-[#E4E6EB] transition"
                />
                <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-1">
                  Used in invite links and login. Letters, numbers, and hyphens.
                </p>
              </div>

              {isCodeModified && (
                <div className="p-3 rounded-lg bg-[#FF9500]/10 text-[#FF9500] text-xs flex items-start gap-2 leading-relaxed">
                  <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Notice:</strong> Changing the family code will log you out to apply the update.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingFamily || !hasFamilyChanges}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition border-0 disabled:opacity-40"
              >
                {savingFamily ? 'Saving Changes...' : 'Save Family Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 cols): Add Member & Existing Member List */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Family Member Form */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={Add01Icon} size={18} className="text-[var(--theme-primary)]" />
                Add New Family Member
              </span>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                  First Name / Member Alias <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandma, Uncle Joe, Sophia"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border border-transparent focus:border-[var(--theme-primary)] text-sm text-[#050505] dark:text-[#E4E6EB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-[#E4E6EB] mb-1.5">
                  Member Avatar
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !alias.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition border-0 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Member to Family'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Members Roster */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <span className="font-bold text-base text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-[var(--theme-primary)]" />
                Family Roster ({members.length})
              </span>
            </div>

            <div className="divide-y divide-[#E4E6EB] dark:divide-[#3A3B3C]">
              {loading ? (
                <div className="py-6 text-center text-sm text-[#65676B] dark:text-[#B0B3B8]">
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className="py-6 text-center text-sm text-[#65676B] dark:text-[#B0B3B8]">
                  No members yet.
                </div>
              ) : (
                members.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C]">
                        {m.avatar || '🎁'}
                      </span>
                      <div>
                        <div className="font-semibold text-sm text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
                          <span>{m.alias}</span>
                          {m.is_admin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]">
                            {m.item_count ?? 0} {m.item_count === 1 ? 'gift' : 'gifts'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!m.is_admin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id, m.alias)}
                        className="p-2 text-[#65676B] dark:text-[#B0B3B8] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition border-0"
                        title="Remove member"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Located at the bottom of the page */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#242526] border border-[#FF3B30]/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#FF3B30] flex items-center gap-2">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} />
            <span>Danger Zone</span>
          </h3>
          <span className="text-xs text-[#FF3B30] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF3B30]/10">
            Irreversible
          </span>
        </div>
        <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-relaxed max-w-2xl">
          Permanently delete all wishlist items, links, prices, and marks across all family members in {family?.name} to start fresh for a new holiday or season.
        </p>
        <button
          type="button"
          onClick={() => {
            triggerWarning?.();
            setResetError('');
            setShowResetConfirm(true);
          }}
          className="py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#FF3B30] hover:bg-[#D70015] transition border-0 inline-flex items-center gap-2"
        >
          <HugeiconsIcon icon={Delete02Icon} size={15} />
          <span>Reset Entire Family Wishlist</span>
        </button>

        {resetSuccess && (
          <div className="p-2.5 rounded-lg bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158] text-xs font-medium flex items-center gap-2">
            <HugeiconsIcon icon={Tick02Icon} size={15} />
            <span>{resetSuccess}</span>
          </div>
        )}
        {resetError && (
          <div className="p-2.5 rounded-lg bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium flex items-center gap-2">
            <HugeiconsIcon icon={AlertCircleIcon} size={15} />
            <span>{resetError}</span>
          </div>
        )}
      </div>

      {/* Member Delete Destructive Warning Dialog */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        title="Remove Family Member?"
        message={`Are you sure you want to remove "${memberToDelete?.alias}"? This will permanently remove their profile and wishlist.`}
        confirmText="Remove Member"
        cancelText="Cancel"
        isDestructive={true}
        loading={deletingMember}
        onConfirm={handleConfirmDeleteMember}
        onCancel={() => !deletingMember && setMemberToDelete(null)}
      />

      {/* Reset Wishlist Destructive Warning Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Entire Family Wishlist?"
        message={`This will permanently delete ALL items, links, prices, and marks across every family member in ${family?.name}. This action cannot be undone.`}
        confirmText="Yes, Delete All"
        cancelText="Cancel"
        isDestructive={true}
        loading={resetting}
        onConfirm={handleConfirmResetWishlist}
        onCancel={() => !resetting && setShowResetConfirm(false)}
      />
    </div>
  );
}
