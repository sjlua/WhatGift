import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { api, updateWebManifest } from '../api/client';
import { useIsDesktop } from '../hooks/useMediaQuery';
import Navbar from '../components/Navbar';
import WishlistCard from '../components/WishlistCard';
import ItemModal from '../components/ItemModal';
import ClaimModal from '../components/ClaimModal';
import AdminModal from '../components/AdminModal';
import ProfileModal from '../components/ProfileModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SettingsView from '../components/SettingsView';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  UserGroupIcon,
  Add01Icon,
  ViewOffIcon,
  Shield01Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  Settings02Icon,
  Link01Icon,
  Tick02Icon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';

export default function DashboardPage() {
  const { user, family, isAdmin, logout, refreshFamily } = useAuth();
  const { theme, isDark } = useTheme();
  const { triggerSelection, triggerSuccess, triggerWarning } = useHaptics();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    refreshFamily();
  }, []);

  // When saved as a web app, preserve family code so user never has to re-enter it
  useEffect(() => {
    if (family?.code) {
      localStorage.setItem('whatgift_last_family_code', family.code);
      if (user?.alias) {
        localStorage.setItem('whatgift_last_alias', user.alias);
      }
      updateWebManifest(family.code);

      // Keep ?family=CODE in the browser address bar so iOS Safari "Add to Home Screen"
      // automatically captures the family code into the homescreen web app launcher!
      try {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('family') !== family.code) {
          currentUrl.searchParams.set('family', family.code);
          window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
        }
      } catch {}
    }
  }, [family?.code, user?.alias]);

  const [activeTab, setActiveTab] = useState('my-wishes'); // 'my-wishes' | 'family-wishes'
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [familyFilter, setFamilyFilter] = useState('all'); // 'all' | 'available' | 'claimed'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals and tooltips state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimTargetItem, setClaimTargetItem] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showMobileSecretTooltip, setShowMobileSecretTooltip] = useState(false);
  const [showSecretTooltip, setShowSecretTooltip] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Other members in family (excluding the current user)
  const otherMembers = family?.members?.filter((m) => m.id !== user.id) || [];
  const [memberItemCounts, setMemberItemCounts] = useState({});
  const [memberClaimStatuses, setMemberClaimStatuses] = useState({});

  useEffect(() => {
    if (family?.members) {
      const counts = {};
      const statuses = {};
      family.members.forEach((m) => {
        if (m.item_count !== undefined) {
          counts[m.id] = m.item_count;
        }
        if (m.viewer_claim_status !== undefined) {
          statuses[m.id] = m.viewer_claim_status;
        }
      });
      setMemberItemCounts((prev) => ({ ...counts, ...prev }));
      setMemberClaimStatuses((prev) => ({ ...statuses, ...prev }));
    }
  }, [family]);

  // When switching to family tab, default selected member to first other member if none selected
  useEffect(() => {
    if (activeTab === 'family-wishes' && !selectedMemberId && otherMembers.length > 0) {
      setSelectedMemberId(otherMembers[0].id);
    }
  }, [activeTab, otherMembers, selectedMemberId]);

  const [copiedSidebarLink, setCopiedSidebarLink] = useState(false);
  const handleCopySidebarInvite = () => {
    if (!family?.code) return;
    const url = `${window.location.origin}/?family=${encodeURIComponent(family.code)}`;
    navigator.clipboard.writeText(url);
    triggerSuccess();
    setCopiedSidebarLink(true);
    setTimeout(() => setCopiedSidebarLink(false), 2000);
  };

  // Load wishlist items whenever activeTab or selectedMemberId changes
  const loadItems = async () => {
    if (activeTab === 'settings') {
      setLoading(false);
      return;
    }
    const targetUserId = activeTab === 'my-wishes' ? user.id : selectedMemberId;
    if (!targetUserId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.getUserItems(targetUserId);
      setItems(data);
      setMemberItemCounts((prev) => ({ ...prev, [targetUserId]: data.length }));

      if (targetUserId !== user.id) {
        const viewerClaimed = data.filter((i) => i.claim?.is_claimed_by_viewer);
        let status = null;
        if (viewerClaimed.some((i) => i.claim?.status === 'bought' || i.claim?.status === 'purchased')) {
          status = 'bought';
        } else if (viewerClaimed.some((i) => i.claim?.status === 'want_to_buy' || i.claim?.status === 'claimed')) {
          status = 'want_to_buy';
        }
        setMemberClaimStatuses((prev) => ({ ...prev, [targetUserId]: status }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [activeTab, selectedMemberId]);

  // Item Handlers
  const handleOpenAddItem = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (payload) => {
    if (itemToEdit) {
      await api.updateItem(itemToEdit.id, payload);
    } else {
      await api.createItem(payload);
    }
    triggerSuccess();
    await loadItems();
  };

  const handleDeleteItem = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    setItemToDelete(item || { id: itemId, title: 'this gift' });
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await api.deleteItem(itemToDelete.id);
      triggerWarning();
      setItemToDelete(null);
      await loadItems();
    } catch (err) {
      setAlertMessage(err.message || 'Failed to delete item');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Claim Handlers
  const handleOpenClaim = (item) => {
    triggerSelection();
    setClaimTargetItem(item);
    setIsClaimModalOpen(true);
  };

  const handleSaveClaim = async (itemId, payload) => {
    if (claimTargetItem?.claim?.is_claimed_by_viewer) {
      await api.updateClaim(itemId, payload);
    } else {
      await api.claimItem(itemId, payload);
    }
    triggerSuccess();
    await loadItems();
    await refreshFamily();
  };

  const handleReleaseClaim = async (itemId) => {
    await api.unclaimItem(itemId);
    triggerWarning();
    await loadItems();
    await refreshFamily();
  };

  const handleQuickMark = async (itemId, status) => {
    try {
      const targetItem = items.find((i) => i.id === itemId);
      if (targetItem?.claim?.is_claimed_by_viewer) {
        await api.updateClaim(itemId, { status });
      } else {
        await api.claimItem(itemId, { status });
      }
      triggerSuccess();
      await loadItems();
      await refreshFamily();
    } catch (err) {
      setAlertMessage(err.message || 'Failed to mark gift');
    }
  };

  const handleWishlistReset = () => {
    loadItems();
    refreshFamily();
    setMemberItemCounts({});
    setMemberClaimStatuses({});
  };

  const activeSelectedMember = otherMembers.find((m) => m.id === selectedMemberId);

  const availableCount = items.filter((i) => !i.claim).length;
  const claimedCount = items.filter((i) => Boolean(i.claim)).length;

  const displayedFamilyItems = items.filter((item) => {
    if (familyFilter === 'available') return !item.claim;
    if (familyFilter === 'claimed') return Boolean(item.claim);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-[#0A0A0C] flex flex-col pb-24 lg:pb-12 transition-colors duration-200 relative overflow-x-hidden">
      {/* Dynamic Ambient Holiday Aura */}
      <div
        className="absolute top-0 left-0 right-0 h-96 pointer-events-none transition-all duration-500 opacity-60 dark:opacity-30"
        style={{
          background: isDark
            ? `radial-gradient(ellipse 80% 60% at 50% -20%, ${theme.tintDark || theme.tint}, transparent 70%)`
            : `radial-gradient(ellipse 80% 60% at 50% -20%, ${theme.tint}, transparent 70%)`,
        }}
      />

      {/* Top Navigation Bar */}
      <Navbar
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenProfile={() => {
          setActiveTab('settings');
          triggerSelection();
        }}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          triggerSelection();
        }}
        onSwitchUser={logout}
      />

      {/* Main Container - Responsive width from mobile to large desktop displays */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-6 pt-[calc(max(0.5rem,env(safe-area-inset-top))+4.75rem)] sm:pt-[calc(max(0.5rem,env(safe-area-inset-top))+5.5rem)] lg:pt-4 flex-1 relative z-10">
        {/* Mobile / Tablet Top Control Bar (Visible below lg, desktop uses persistent sidebar) */}
        <div className="lg:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {/* Segmented Tabs with Clean Apple HIG Styling */}
          <div className="flex gap-1.5 p-1.5 bg-[#E5E5EA]/70 dark:bg-[#1C1C1E] rounded-3xl shadow-inner w-full sm:w-auto border-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('my-wishes');
                triggerSelection();
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-[18px] text-xs sm:text-sm transition-all duration-150 border-0 ${
                activeTab === 'my-wishes'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-apple-tab font-bold ring-1 ring-black/[0.04]'
                  : 'text-[#636366] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white font-semibold'
              }`}
            >
              <HugeiconsIcon icon={GiftIcon} size={16} />
              <span>My Wishlist</span>
              <span
                className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full border-0 transition ${
                  activeTab === 'my-wishes'
                    ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)] font-bold'
                    : 'bg-[#767680]/15 dark:bg-[#38383A] text-[#636366] dark:text-[#8E8E93] font-medium'
                }`}
              >
                {activeTab === 'my-wishes' ? items.length : '•'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('family-wishes');
                triggerSelection();
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-[18px] text-xs sm:text-sm transition-all duration-150 border-0 ${
                activeTab === 'family-wishes'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-apple-tab font-bold ring-1 ring-black/[0.04]'
                  : 'text-[#636366] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white font-semibold'
              }`}
            >
              <HugeiconsIcon icon={UserGroupIcon} size={16} />
              <span>Family</span>
              <span
                className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full border-0 transition ${
                  activeTab === 'family-wishes'
                    ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)] font-bold'
                    : 'bg-[#767680]/15 dark:bg-[#38383A] text-[#636366] dark:text-[#8E8E93] font-medium'
                }`}
              >
                {otherMembers.length}
              </span>
            </button>
          </div>

          {/* Tablet Action Area (Hidden on mobile where FAB is used) */}
          <div className="hidden sm:flex lg:hidden items-center gap-2">
            {activeTab === 'my-wishes' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    triggerSelection();
                    setShowSecretTooltip((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-apple-sm transition border-0 text-xs font-semibold"
                  aria-label="Top Secret Information"
                >
                  <HugeiconsIcon icon={ViewOffIcon} size={15} className="text-[var(--theme-primary)]" />
                  <span>Top Secret</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddItem}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-95"
                >
                  <HugeiconsIcon icon={Add01Icon} size={16} />
                  <span>Add Gift</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dual-Column Layout: Persistent Desktop Sidebar on Left, Dynamic Workspace on Right */}
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-5 items-start">
          {/* DESKTOP PERSISTENT SIDEBAR */}
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-4 space-y-2.5">
            {/* Unified Sidebar Container */}
            <div className="bg-white dark:bg-[#161618] rounded-2xl border-0 shadow-apple-card p-3 space-y-3.5">
              {/* Branding Header */}
              <div className="flex items-center gap-2.5 px-1 pt-0.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-apple-sm shrink-0"
                  style={{
                    background: theme.gradient || theme.primary,
                  }}
                >
                  <HugeiconsIcon icon={GiftIcon} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-heading font-extrabold text-base text-[#1C1C1E] dark:text-white tracking-tight leading-tight">
                    WhatGift
                  </div>
                  <div className="text-[11px] font-semibold text-[#8E8E93] truncate" title={family?.name}>
                    {family?.name}
                  </div>
                </div>
              </div>

              {/* Group 1: WISHLISTS */}
              <div className="space-y-1">
                <div className="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Wishlists
                </div>
                {/* My Wishlist */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my-wishes');
                    triggerSelection();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 border-0 ${
                    activeTab === 'my-wishes'
                      ? 'bg-[var(--theme-primary)] text-white shadow-apple-sm font-bold'
                      : 'bg-transparent hover:bg-[#F0F0F3] dark:hover:bg-[#222226] text-[#1C1C1E] dark:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <HugeiconsIcon icon={GiftIcon} size={15} />
                    <span>My Wishlist</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                      activeTab === 'my-wishes'
                        ? 'bg-white/25 text-white'
                        : 'bg-[#F0F0F3] dark:bg-[#222226] text-[#8E8E93]'
                    }`}
                  >
                    {items.length && activeTab === 'my-wishes' ? items.length : '•'}
                  </span>
                </button>

                {/* Family Wishlists Header */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('family-wishes');
                    triggerSelection();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 border-0 ${
                    activeTab === 'family-wishes' && !selectedMemberId
                      ? 'bg-[var(--theme-primary)] text-white shadow-apple-sm font-bold'
                      : 'bg-transparent hover:bg-[#F0F0F3] dark:hover:bg-[#222226] text-[#1C1C1E] dark:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <HugeiconsIcon icon={UserGroupIcon} size={15} />
                    <span>Family Wishlists</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                      activeTab === 'family-wishes' && !selectedMemberId
                        ? 'bg-white/25 text-white'
                        : 'bg-[#F0F0F3] dark:bg-[#222226] text-[#8E8E93]'
                    }`}
                  >
                    {otherMembers.length}
                  </span>
                </button>

                {/* Nested Family Members list under Wishlists */}
                {otherMembers.length > 0 && (
                  <div className="pl-3 pr-0.5 pt-0.5 space-y-0.5 border-l border-[#E5E5EA] dark:border-[#2C2C2E] ml-3.5 my-1">
                    {otherMembers.map((member) => {
                      const isSelected = activeTab === 'family-wishes' && selectedMemberId === member.id;
                      const count = memberItemCounts[member.id] ?? member.item_count ?? 0;
                      const claimStatus = memberClaimStatuses[member.id] ?? member.viewer_claim_status;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            triggerSelection();
                            setActiveTab('family-wishes');
                            setSelectedMemberId(member.id);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-left transition-all duration-150 border-0 ${
                            isSelected
                              ? 'bg-[var(--theme-primary)] text-white shadow-apple-sm font-bold'
                              : 'bg-transparent hover:bg-[#F0F0F3] dark:hover:bg-[#222226] text-[#1C1C1E] dark:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm leading-none shrink-0">{member.avatar || '🎁'}</span>
                            <span className="text-xs truncate">{member.alias}</span>
                          </div>
                          {claimStatus ? (
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                claimStatus === 'bought' ? 'bg-[#34C759]' : 'bg-[#FF9500]'
                              }`}
                              title={claimStatus === 'bought' ? 'Gift bought' : 'Want to buy'}
                            />
                          ) : (
                            <span
                              className={`text-[10px] font-semibold ${
                                isSelected ? 'text-white/80' : 'text-[#8E8E93]'
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group 2: SETTINGS */}
              <div className="space-y-1 pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
                <div className="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Settings
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    triggerSelection();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 border-0 ${
                    activeTab === 'settings'
                      ? 'bg-[var(--theme-primary)] text-white shadow-apple-sm font-bold'
                      : 'bg-transparent hover:bg-[#F0F0F3] dark:hover:bg-[#222226] text-[#1C1C1E] dark:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <HugeiconsIcon icon={Settings02Icon} size={15} />
                    <span>Preferences & Themes</span>
                  </div>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(true)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F0F0F3] dark:hover:bg-[#222226] transition border-0"
                  >
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={UserGroupIcon} size={15} />
                      <span>Manage Family</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                      Admin
                    </span>
                  </button>
                )}

                {/* Quick Family Invite code & button */}
                <div className="p-2 rounded-lg bg-[#F0F0F3] dark:bg-[#222226] flex items-center justify-between gap-1 text-[11px] mt-1">
                  <span className="font-mono font-bold text-[var(--theme-primary)] truncate">
                    {family?.code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySidebarInvite}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#161618] hover:bg-white/80 text-[10px] font-bold text-[#1C1C1E] dark:text-white shadow-apple-sm border-0 transition"
                  >
                    {copiedSidebarLink ? (
                      <span className="text-[#34C759]">Copied</span>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Link01Icon} size={11} />
                        <span>Invite</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* User Account & Sign Out (Only option in sidebar) */}
              <div className="pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E] space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl leading-none shrink-0">{user?.avatar || '🎁'}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1C1C1E] dark:text-white truncate">
                        {user?.alias}
                      </div>
                      <div className="text-[10px] text-[#8E8E93] truncate">
                        {isAdmin ? 'Family Admin' : 'Family Member'}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold text-[#636366] dark:text-[#8E8E93] hover:text-[#FF3B30] dark:hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition border-0 active:scale-95"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN WORKSPACE CONTENT AREA */}
          <div className="min-w-0 w-full">
            {/* VIEW 1: MY WISHLIST */}
            {activeTab === 'my-wishes' && (
              <div className="space-y-4 lg:space-y-3.5 animate-tab-fade">
                {/* Wishlist Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 lg:p-3 rounded-2xl sm:rounded-3xl lg:rounded-xl bg-white dark:bg-[#161618] border-0 shadow-apple-card">
                  <div className="flex items-center gap-3 sm:gap-4 lg:gap-2.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-9 lg:h-9 rounded-xl sm:rounded-2xl lg:rounded-lg bg-[var(--theme-tint)] text-[var(--theme-primary)] flex items-center justify-center shrink-0 shadow-apple-sm">
                      <HugeiconsIcon icon={GiftIcon} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#1C1C1E] dark:text-white leading-tight">
                          My Wishlist
                        </h3>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                          {items.length} {items.length === 1 ? 'Gift' : 'Gifts'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#8E8E93] mt-0.5 font-sans">
                        Gifts you would love to receive • Purchases remain secret from you to preserve the surprise
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {/* Top Secret Info Tooltip Button */}
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          triggerSelection();
                          setShowSecretTooltip((prev) => !prev);
                        }}
                        className="inline-flex items-center gap-1.5 py-2 px-3 lg:py-1.5 lg:px-2.5 rounded-xl lg:rounded-lg bg-[#F0F0F3] dark:bg-[#222226] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-apple-sm transition border-0 text-xs font-semibold"
                        aria-label="Top Secret Information"
                        title="Top Secret info"
                      >
                        <HugeiconsIcon icon={ViewOffIcon} size={14} className="text-[var(--theme-primary)]" />
                        <span className="hidden sm:inline">Top Secret</span>
                      </button>

                      {/* Tooltip Popover */}
                      <div
                        className={`absolute right-0 top-full mt-2 w-72 p-3.5 rounded-2xl bg-white/95 dark:bg-[#222226]/95 backdrop-blur-xl shadow-apple-lg border-0 text-xs z-50 transition-all duration-150 ${
                          showSecretTooltip
                            ? 'opacity-100 pointer-events-auto'
                            : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1 text-[var(--theme-primary)] font-bold">
                          <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={ViewOffIcon} size={15} />
                            <span>Top Secret</span>
                          </div>
                          {showSecretTooltip && (
                            <button
                              type="button"
                              onClick={() => setShowSecretTooltip(false)}
                              className="w-5 h-5 flex items-center justify-center rounded-full text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition border-0"
                              aria-label="Close tooltip"
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={13} />
                            </button>
                          )}
                        </div>
                        <p className="text-[#636366] dark:text-[#8E8E93] text-[11px] leading-relaxed">
                          You won't know if your items have been claimed or bought! Status is kept hidden from you to preserve the surprise.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddItem}
                      className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 lg:px-3 lg:py-1.5 rounded-xl lg:rounded-lg text-xs sm:text-sm lg:text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-95"
                    >
                      <HugeiconsIcon icon={Add01Icon} size={15} />
                      <span>Add Gift</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="py-24 text-center text-[#8E8E93] text-sm flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                    <span>Loading your gifts...</span>
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-white dark:bg-[#161618] rounded-3xl lg:rounded-xl border-0 shadow-apple-card w-full">
                    <div className="w-14 h-14 rounded-2xl bg-[#F0F0F3] dark:bg-[#222226] flex items-center justify-center text-[#8E8E93] mx-auto mb-3 shadow-apple-sm">
                      <HugeiconsIcon icon={GiftIcon} size={26} />
                    </div>
                    <h4 className="font-heading font-bold text-[#1C1C1E] dark:text-white text-base mb-1">
                      Your wishlist is empty
                    </h4>
                    <p className="text-xs text-[#8E8E93] max-w-xs mx-auto mb-4 leading-relaxed font-sans">
                      Add items you would love to receive, with links, sizes, or approximate prices.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddItem}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl lg:rounded-lg text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-95"
                    >
                      <HugeiconsIcon icon={Add01Icon} size={16} /> Add Your First Gift
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 lg:gap-3.5 items-start">
                    {items.map((item) => (
                      <WishlistCard
                        key={item.id}
                        item={item}
                        onEdit={handleOpenEditItem}
                        onClaim={handleOpenClaim}
                        onEditClaim={handleOpenClaim}
                        onReleaseClaim={handleReleaseClaim}
                        onQuickMark={handleQuickMark}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: FAMILY WISHLISTS */}
            {activeTab === 'family-wishes' && (
              <div className="animate-tab-fade">
                {/* Mobile Member Selector (Visible only on mobile/tablet) */}
                <div className="lg:hidden mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white">
                        Select Member:
                      </p>
                      {!isMobileMembersOpen && activeSelectedMember && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-[#1C1C1E] shadow-apple-sm text-xs font-bold text-[#1C1C1E] dark:text-white border-0 animate-in fade-in duration-150">
                          <span className="text-sm leading-none">{activeSelectedMember.avatar || '🎁'}</span>
                          <span>{activeSelectedMember.alias}</span>
                          {(memberClaimStatuses[activeSelectedMember.id] ?? activeSelectedMember.viewer_claim_status) && (
                            <span
                              className={`w-2 h-2 rounded-full ml-0.5 ${
                                (memberClaimStatuses[activeSelectedMember.id] ?? activeSelectedMember.viewer_claim_status) === 'bought'
                                  ? 'bg-[#34C759]'
                                  : 'bg-[#FF9500]'
                              }`}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerSelection();
                        setIsMobileMembersOpen(!isMobileMembersOpen);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white shadow-apple-sm active:scale-95 transition-all border-0"
                      aria-label={isMobileMembersOpen ? 'Collapse member list' : 'Expand member list'}
                      title={isMobileMembersOpen ? 'Collapse' : 'Expand'}
                    >
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={14}
                        className={`transition-transform duration-200 ${isMobileMembersOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>

                  {isMobileMembersOpen && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 animate-in fade-in duration-150">
                      {otherMembers.map((member) => {
                        const count = memberItemCounts[member.id] ?? member.item_count ?? 0;
                        const isSelected = selectedMemberId === member.id;
                        const claimStatus = memberClaimStatuses[member.id] ?? member.viewer_claim_status;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              triggerSelection();
                              setSelectedMemberId(member.id);
                            }}
                            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-bold transition-all border-0 shadow-apple-sm active:scale-95 ${
                              isSelected
                                ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-apple-md ring-2 ring-black/10 dark:ring-white/10'
                                : 'bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]'
                            }`}
                          >
                            <span className="text-base leading-none">{member.avatar || '🎁'}</span>
                            <span>{member.alias}</span>
                            {claimStatus ? (
                              <span
                                title={claimStatus === 'bought' ? 'Gift bought' : 'Want to buy gift'}
                                className={`inline-block w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ml-0.5 ${
                                  claimStatus === 'bought'
                                    ? 'bg-[#34C759] ring-2 ring-[#34C759]/40'
                                    : 'bg-[#FF9500] ring-2 ring-[#FF9500]/40'
                                }`}
                              />
                            ) : (
                              <span
                                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                                  isSelected
                                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#1C1C1E]'
                                    : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93]'
                                }`}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {otherMembers.length === 0 ? (
                  <div className="text-center py-16 sm:py-20 px-6 bg-white dark:bg-[#161618] rounded-3xl lg:rounded-xl border-0 shadow-apple-card w-full">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl lg:rounded-xl bg-[#F8F8FA] dark:bg-[#222226] flex items-center justify-center text-[#8E8E93] mx-auto mb-3 shadow-apple-sm">
                      <HugeiconsIcon icon={UserGroupIcon} size={28} />
                    </div>
                    <h4 className="font-heading font-bold text-[#1C1C1E] dark:text-white text-base sm:text-lg mb-1">
                      No other family members yet
                    </h4>
                    <p className="text-xs sm:text-sm text-[#8E8E93] max-w-xs mx-auto mb-4 sm:mb-5 leading-relaxed font-sans">
                      {isAdmin
                        ? 'Use the Manage Family panel to add members to your family.'
                        : 'Ask your family admin to invite other family members.'}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsAdminModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 rounded-xl lg:rounded-lg shadow-apple-md transition active:scale-95"
                      >
                        Manage Family & Add Members
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Active Member Header Card */}
                    {activeSelectedMember && (
                      <div className="flex items-center justify-between p-3.5 sm:p-5 lg:p-3 rounded-2xl sm:rounded-3xl lg:rounded-xl bg-white dark:bg-[#161618] border-0 shadow-apple-card mb-4 lg:mb-3">
                        <div className="flex items-center gap-3 sm:gap-4 lg:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-9 lg:h-9 rounded-xl sm:rounded-2xl lg:rounded-lg bg-[#F8F8FA] dark:bg-[#222226] flex items-center justify-center text-xl sm:text-2xl lg:text-lg shadow-apple-sm border-0 shrink-0">
                            {activeSelectedMember.avatar || '🎁'}
                          </div>
                          <div>
                            <h3 className="text-base sm:text-xl lg:text-base font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                              {activeSelectedMember.alias}'s Wishlist
                            </h3>
                            <p className="text-xs lg:text-[11px] text-[#8E8E93] mt-0.5">
                              Claim items to coordinate with family and prevent duplicate gifts.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm lg:text-xs font-bold text-[#636366] dark:text-[#E5E5EA] bg-[#F8F8FA] dark:bg-[#222226] px-2.5 sm:px-3 py-1 sm:py-1.5 lg:px-2.5 lg:py-1 rounded-xl lg:rounded-lg shadow-apple-sm border-0 shrink-0">
                          {items.length} {items.length === 1 ? 'gift' : 'gifts'}
                        </span>
                      </div>
                    )}

                    {/* Segmented Filter Pills: All / Available / Claimed */}
                    {items.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 lg:mb-3">
                        <div className="flex gap-1 p-1 bg-[#E5E5EA]/70 dark:bg-[#222226] rounded-2xl lg:rounded-lg shadow-inner border-0">
                          <button
                            type="button"
                            onClick={() => setFamilyFilter('all')}
                            className={`px-3 py-1.5 lg:px-2.5 lg:py-1 rounded-xl lg:rounded-md text-xs lg:text-[11px] font-bold transition-all duration-150 border-0 ${
                              familyFilter === 'all'
                                ? 'bg-white dark:bg-[#161618] text-[#1C1C1E] dark:text-white shadow-apple-sm'
                                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                            }`}
                          >
                            All ({items.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFamilyFilter('available')}
                            className={`px-3 py-1.5 lg:px-2.5 lg:py-1 rounded-xl lg:rounded-md text-xs lg:text-[11px] font-bold transition-all duration-150 border-0 flex items-center gap-1.5 ${
                              familyFilter === 'available'
                                ? 'bg-white dark:bg-[#161618] text-[#1C1C1E] dark:text-white shadow-apple-sm'
                                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)]" />
                            <span>Available ({availableCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFamilyFilter('claimed')}
                            className={`px-3 py-1.5 lg:px-2.5 lg:py-1 rounded-xl lg:rounded-md text-xs lg:text-[11px] font-bold transition-all duration-150 border-0 flex items-center gap-1.5 ${
                              familyFilter === 'claimed'
                                ? 'bg-white dark:bg-[#161618] text-[#1C1C1E] dark:text-white shadow-apple-sm'
                                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                            <span>Claimed ({claimedCount})</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Grid of Wishlist Items */}
                    {loading ? (
                      <div className="py-24 text-center text-[#8E8E93] text-sm flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                        <span>Loading {activeSelectedMember?.alias}'s wishlist...</span>
                      </div>
                    ) : items.length === 0 ? (
                      <div className="text-center py-16 sm:py-20 px-6 bg-white dark:bg-[#161618] rounded-3xl lg:rounded-xl border-0 shadow-apple-card w-full">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl lg:rounded-xl bg-[#F8F8FA] dark:bg-[#222226] flex items-center justify-center text-[#8E8E93] mx-auto mb-3 shadow-apple-sm">
                          <HugeiconsIcon icon={GiftIcon} size={26} />
                        </div>
                        <h4 className="font-bold text-[#1C1C1E] dark:text-white text-base sm:text-lg mb-1">
                          {activeSelectedMember?.alias || 'This member'} hasn't added any wishes yet
                        </h4>
                        <p className="text-xs sm:text-sm text-[#8E8E93] max-w-sm mx-auto">
                          Check back soon or remind them to add some ideas!
                        </p>
                      </div>
                    ) : displayedFamilyItems.length === 0 ? (
                      <div className="text-center py-14 sm:py-16 px-6 bg-white dark:bg-[#161618] rounded-3xl lg:rounded-xl border-0 shadow-apple-card w-full">
                        <p className="text-sm font-semibold text-[#8E8E93]">
                          {familyFilter === 'available'
                            ? 'All items on this wishlist have been claimed or bought! 🎉'
                            : 'No claimed items on this wishlist yet.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-3.5 items-start">
                        {displayedFamilyItems.map((item) => (
                          <WishlistCard
                            key={item.id}
                            item={item}
                            onEdit={handleOpenEditItem}
                            onClaim={handleOpenClaim}
                            onEditClaim={handleOpenClaim}
                            onReleaseClaim={handleReleaseClaim}
                            onQuickMark={handleQuickMark}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: SETTINGS VIEW (Dedicated page instead of modal) */}
            {activeTab === 'settings' && (
              <div className="animate-tab-fade">
                <SettingsView
                  onOpenAdmin={() => setIsAdminModalOpen(true)}
                  onBackToWishes={() => {
                    setActiveTab('my-wishes');
                    triggerSelection();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Floating Action Controls */}
      {activeTab === 'my-wishes' && (
        <div className="sm:hidden fixed bottom-6 right-6 z-30 flex flex-col items-center gap-2.5">
          {/* Top Secret Info Tooltip Button (Above Add Gift FAB) */}
          <div className="relative">
            {showMobileSecretTooltip && (
              <div
                className="absolute right-0 bottom-full mb-2 w-64 p-3.5 rounded-2xl bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl shadow-apple-lg border-0 text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1 text-[var(--theme-primary)] font-bold">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={ViewOffIcon} size={15} />
                    <span>Top Secret</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileSecretTooltip(false)}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition border-0"
                    aria-label="Close tooltip"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                </div>
                <p className="text-[#636366] dark:text-[#8E8E93] text-[11px] leading-relaxed">
                  You won't know if your items have been claimed or bought! Status is kept hidden from you to protect the surprise.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                triggerSelection();
                setShowMobileSecretTooltip((prev) => !prev);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] text-[var(--theme-primary)] border-0 shadow-apple-md active:scale-95 transition"
              aria-label="Top Secret Information"
              title="Top Secret"
            >
              <HugeiconsIcon icon={ViewOffIcon} size={18} />
            </button>
          </div>

          {/* Add Gift FAB */}
          <button
            type="button"
            onClick={handleOpenAddItem}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--theme-primary)] text-white border-0 shadow-apple-lg active:scale-95 transition"
            aria-label="Add Gift"
          >
            <HugeiconsIcon icon={Add01Icon} size={28} />
          </button>
        </div>
      )}

      {/* Accessible Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
      />

      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        item={claimTargetItem}
        onSaveClaim={handleSaveClaim}
        onReleaseClaim={handleReleaseClaim}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onWishlistReset={handleWishlistReset}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenAdmin={() => {
          setIsProfileModalOpen(false);
          setIsAdminModalOpen(true);
        }}
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Delete Gift Wish"
        message={`Are you sure you want to remove "${itemToDelete?.title || 'this gift'}" from your wishlist? This action cannot be undone.`}
        confirmText="Delete Wish"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeletingItem}
        onConfirm={handleConfirmDeleteItem}
        onCancel={() => !isDeletingItem && setItemToDelete(null)}
      />

      {/* In-App Native Notice Dialog */}
      <ConfirmDialog
        isOpen={!!alertMessage}
        title="Notice"
        message={alertMessage || ''}
        confirmText="OK"
        cancelText="Close"
        isDestructive={false}
        onConfirm={() => setAlertMessage(null)}
        onCancel={() => setAlertMessage(null)}
      />
    </div>
  );
}
