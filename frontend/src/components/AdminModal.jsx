import React, { useState, useEffect } from 'react';
import Modal from './Modal';
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
} from '@hugeicons/core-free-icons';

export default function AdminModal({ isOpen, onClose, onWishlistReset }) {
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
    if (isOpen) {
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
    }
  }, [isOpen, family]);

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
        // Store new code for automatic lookup on the login page
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
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Family" maxWidth="max-w-lg">
      <div className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-[#FF3B30]/10 text-[#FF3B30]">
            <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158]">
            <HugeiconsIcon icon={Tick02Icon} size={15} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Section 0: Direct Invite Link Box */}
        <div className="bg-[var(--theme-tint)] p-4 rounded-2xl border-0 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-sans font-bold text-xs text-[var(--theme-primary)] flex items-center gap-1.5">
              <HugeiconsIcon icon={Link01Icon} size={14} />
              Family Invite Link
            </span>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="text-xs font-semibold text-[var(--theme-primary)] hover:underline"
            >
              {copiedInvite ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-xs text-[#636366] dark:text-[#8E8E93] mb-2.5 leading-relaxed">
            Send this link to family members. When they open it, they will automatically be launched into {family?.name} and can log in simply by typing their first name.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border-0 text-[#1C1C1E] dark:text-white select-all focus:outline-none shadow-apple-sm"
            />
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-sm transition shrink-0"
            >
              {copiedInvite ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Section 1: Family Settings (Name & Invite Code) */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border-0 shadow-apple-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E5EA] dark:border-[#38383A]">
            <span className="font-sans font-bold text-xs text-[#8E8E93] dark:text-[#A1A1A6] flex items-center gap-1.5">
              <HugeiconsIcon icon={Edit02Icon} size={14} className="text-[var(--theme-primary)]" />
              Family Name & Code
            </span>
            <span className="text-[11px] text-[#8E8E93]">Admin settings</span>
          </div>

          {familyError && (
            <div className="mb-3 flex items-center gap-2 p-2.5 text-xs rounded-xl bg-[#FF3B30]/10 text-[#FF3B30]">
              <HugeiconsIcon icon={AlertCircleIcon} size={14} className="shrink-0" />
              <span>{familyError}</span>
            </div>
          )}

          {familySuccess && (
            <div className="mb-3 flex items-center gap-2 p-2.5 text-xs rounded-xl bg-[#34C759]/10 text-[#1B8036] dark:text-[#30D158]">
              <HugeiconsIcon icon={Tick02Icon} size={14} className="shrink-0" />
              <span>{familySuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveFamily} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1C1E] dark:text-white mb-1">
                Family Name <span className="text-[#FF3B30] font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. The Miller Family"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border-0 text-sm text-[#1C1C1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] shadow-apple-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1C1E] dark:text-white mb-1">
                Family Code <span className="text-[#FF3B30] font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                placeholder="e.g. MILLER-2026"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border-0 text-sm font-mono tracking-wider text-[#1C1C1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] shadow-apple-sm transition uppercase"
              />
              <p className="text-[11px] text-[#8E8E93] mt-1 leading-normal">
                Used in invite links and login. Letters, numbers, and hyphens.
              </p>
            </div>

            {/* Warning banner when family code is modified */}
            {isCodeModified && (
              <div className="p-2.5 rounded-xl bg-[#FF9500]/10 text-[#FF9500] dark:text-[#FF9F0A] text-xs flex items-start gap-2 leading-relaxed">
                <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> Changing the family code will <strong>automatically log you out</strong> to ensure changes are saved. Family members will need the new code or invite link.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingFamily || !hasFamilyChanges}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white border-0 shadow-apple-sm transition disabled:opacity-40 ${
                isCodeModified
                  ? 'bg-[#FF9500] hover:bg-[#E08500]'
                  : 'bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)]'
              }`}
            >
              {savingFamily
                ? 'Saving Changes...'
                : isCodeModified
                ? 'Save Code & Log Out'
                : 'Save Family Details'}
            </button>
          </form>
        </div>

        {/* Section 2: Add Member Form */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border-0 shadow-apple-sm">
          <h4 className="font-sans font-bold text-xs text-[#8E8E93] dark:text-[#A1A1A6] mb-3 flex items-center gap-1.5">
            <HugeiconsIcon icon={Add01Icon} size={14} className="text-[var(--theme-primary)]" />
            Add Family Member
          </h4>
          <form onSubmit={handleCreateMember} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#1C1C1E] dark:text-white mb-1">
                First Name / Alias <span className="text-[#FF3B30] font-bold">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chloe, Dad, Timmy"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] text-sm text-[#1C1C1E] dark:text-white focus:outline-none transition shadow-apple-sm"
              />
            </div>

            {/* Profile Avatar Selection (substitute for photo) */}
            <div>
              <label className="block text-xs font-medium text-[#1C1C1E] dark:text-white mb-1.5">
                Profile Avatar
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white dark:bg-[#1C1C1E] rounded-xl border-0 shadow-inner">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition border-0 ${
                      avatar === emoji
                        ? 'bg-[var(--theme-tint)] shadow-apple-sm ring-2 ring-[var(--theme-primary)] scale-105'
                        : 'hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !alias.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-sm transition disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>

        {/* Section 3: Existing Members List */}
        <div>
          <h4 className="font-sans font-bold text-xs text-[#8E8E93] dark:text-[#A1A1A6] mb-2">
            Family Members ({members.length})
          </h4>
          <div className="divide-y divide-[#E5E5EA] dark:divide-[#38383A] border-0 rounded-2xl overflow-hidden bg-white dark:bg-[#2C2C2E] shadow-apple-sm">
            {loading ? (
              <div className="p-4 text-center text-xs text-[#8E8E93]">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8E8E93]">No members yet</div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-[#F2F2F7]/50 dark:hover:bg-white/5 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{m.avatar || '🎁'}</span>
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-sm text-[#1C1C1E] dark:text-white">
                        {m.alias}
                      </div>
                      <div className="text-[11px] text-[#8E8E93]">
                        {m.is_admin ? 'Family administrator' : 'Direct name login'}
                      </div>
                    </div>
                  </div>

                  {!m.is_admin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(m.id, m.alias)}
                      className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition"
                      title="Remove member"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 4: Danger Zone - Reset Entire Family Wishlist */}
        <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#38383A]">
          <h4 className="font-sans font-bold text-xs text-[#FF3B30] mb-2.5 flex items-center gap-1.5">
            <HugeiconsIcon icon={AlertCircleIcon} size={15} />
            <span>Danger Zone</span>
          </h4>
          <div className="p-4 rounded-2xl bg-[#FF3B30]/5 dark:bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                Reset Entire Family Wishlist
              </div>
              <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5 leading-relaxed max-w-sm">
                Permanently delete all wishlist items, links, prices, and gift claims across all family members to start fresh.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerWarning?.();
                setResetError('');
                setShowResetConfirm(true);
              }}
              className="py-2 px-3.5 rounded-xl text-xs font-bold text-white bg-[#FF3B30] hover:bg-[#D70015] border-0 shadow-apple-sm transition active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
              <span>Reset All Wishlists</span>
            </button>
          </div>

          {resetSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-[#34C759]/10 text-[#34C759] text-xs font-medium flex items-center gap-2">
              <HugeiconsIcon icon={Tick02Icon} size={16} className="shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}
          {resetError && (
            <div className="mt-3 p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
              <span>{resetError}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>

    {/* Member Delete Destructive Warning Dialog */}
    <ConfirmDialog
      isOpen={!!memberToDelete}
      title="Remove Family Member?"
      message={`Are you sure you want to remove "${memberToDelete?.alias}"? This will permanently delete their wishlist and any gift marks.`}
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
      message={`This will permanently delete ALL items, links, prices, and gift claims across every family member in ${family?.name}. This action is permanent and cannot be undone.`}
      confirmText="Yes, Delete All"
      cancelText="Cancel"
      isDestructive={true}
      loading={resetting}
      onConfirm={handleConfirmResetWishlist}
      onCancel={() => !resetting && setShowResetConfirm(false)}
    />
  </>
  );
}
