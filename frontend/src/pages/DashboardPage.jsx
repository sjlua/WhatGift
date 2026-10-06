import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { api, updateWebManifest } from '../api/client';
import { useIsDesktop } from '../hooks/useMediaQuery';
import Navbar from '../components/Navbar';
import WishlistCard from '../components/WishlistCard';
import ItemFormView from '../components/ItemFormView';
import AdminView from '../components/AdminView';
import ClaimModal from '../components/ClaimModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SettingsView from '../components/SettingsView';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  UserGroupIcon,
  Add01Icon,
  UserSettings01Icon,
  Settings02Icon,
  Link01Icon,
  Tick02Icon,
  Logout01Icon,
  Search01Icon,
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

      try {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('family') !== family.code) {
          currentUrl.searchParams.set('family', family.code);
          window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
        }
      } catch {}
    }
  }, [family?.code, user?.alias]);

  // Navigation tab: 'my-wishes' | 'family-wishes' | 'add-gift' | 'edit-gift' | 'settings' | 'admin'
  const [activeTab, setActiveTab] = useState('my-wishes');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [familyFilter, setFamilyFilter] = useState('all'); // 'all' | 'available' | 'claimed'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Item form state (for editing)
  const [itemToEdit, setItemToEdit] = useState(null);

  // Claim modal & alerts
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimTargetItem, setClaimTargetItem] = useState(null);
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
    if (activeTab === 'settings' || activeTab === 'admin' || activeTab === 'add-gift' || activeTab === 'edit-gift') {
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

  // Item Handlers (Page based)
  const handleOpenAddItem = () => {
    triggerSelection();
    setItemToEdit(null);
    setActiveTab('add-gift');
  };

  const handleOpenEditItem = (item) => {
    triggerSelection();
    setItemToEdit(item);
    setActiveTab('edit-gift');
  };

  const handleSaveItem = async (payload) => {
    if (itemToEdit) {
      await api.updateItem(itemToEdit.id, payload);
    } else {
      await api.createItem(payload);
    }
    triggerSuccess();
    await loadItems();
    setActiveTab(itemToEdit && !itemToEdit.is_owner ? 'family-wishes' : 'my-wishes');
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

  // Apply search filter
  const searchFiltered = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const displayedFamilyItems = searchFiltered.filter((item) => {
    if (activeTab !== 'family-wishes') return true;
    if (familyFilter === 'available') return !item.claim;
    if (familyFilter === 'claimed') return Boolean(item.claim);
    return true;
  });

  const displayedItems = activeTab === 'family-wishes' ? displayedFamilyItems : searchFiltered;

  // Section header text
  const sectionTitle = activeTab === 'my-wishes'
    ? 'My Wishlist'
    : activeSelectedMember
    ? `${activeSelectedMember.alias}'s Wishlist`
    : 'Family Wishlists';

  return (
    <div className="min-h-screen bg-white dark:bg-[#18191A] flex flex-col transition-colors duration-200 relative">
      {/* ========== MOBILE TOP NAVBAR (lg:hidden) ========== */}
      <Navbar
        onOpenAdmin={() => {
          setActiveTab('admin');
          triggerSelection();
        }}
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

      {/* ========== LAYOUT: Sidebar + Main ========== */}
      <div className="flex flex-1 pt-[calc(max(0.5rem,env(safe-area-inset-top))+4rem)] lg:pt-0">

        {/* ========== DESKTOP LEFT SIDEBAR ========== */}
        <aside className="hidden lg:flex flex-col w-[340px] shrink-0 h-screen sticky top-0 border-r border-[#E4E6EB] dark:border-[#3A3B3C] bg-white dark:bg-[#242526] overflow-y-auto overscroll-contain pb-4">
          {/* Sidebar Header */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight">
                WhatGift
              </h1>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    triggerSelection();
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition border-0 ${
                    activeTab === 'settings'
                      ? 'bg-[var(--theme-primary)] text-white'
                      : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50]'
                  }`}
                  title="Settings"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={18} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65676B] dark:text-[#B0B3B8] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search gifts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] text-sm rounded-full border-0 focus:ring-0"
              />
            </div>
          </div>

          {/* Navigation Items (Add Gift and Top Secret buttons removed per user request) */}
          <nav className="px-2 space-y-0.5">
            {/* My Wishlist */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('my-wishes');
                triggerSelection();
              }}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left transition border-0 ${
                activeTab === 'my-wishes'
                  ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)]'
                  : 'hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                activeTab === 'my-wishes'
                  ? 'bg-[var(--theme-primary)] text-white'
                  : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
              }`}>
                <HugeiconsIcon icon={GiftIcon} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-[15px] font-semibold block ${
                  activeTab === 'my-wishes'
                    ? 'text-[var(--theme-primary)]'
                    : 'text-[#050505] dark:text-[#E4E6EB]'
                }`}>
                  My Wishlist
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full transition ${
                  activeTab === 'my-wishes'
                    ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                    : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                }`}
              >
                {items.length}
              </span>
            </button>
          </nav>

          {/* Divider */}
          <div className="mx-4 my-2 border-t border-[#E4E6EB] dark:border-[#3A3B3C]" />

          {/* Family section header */}
          <div className="px-4 py-1 flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-[#050505] dark:text-[#E4E6EB]">
              Family Members
            </h3>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  triggerSelection();
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition border-0 ${
                  activeTab === 'admin'
                    ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                    : 'text-[var(--theme-primary)] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
                }`}
                title="Manage Family Members"
              >
                <HugeiconsIcon icon={UserSettings01Icon} size={14} />
                <span>Manage</span>
              </button>
            )}
          </div>

          {/* Family member list */}
          <nav className="px-2 space-y-0.5 flex-1">
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
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition border-0 ${
                    isSelected
                      ? 'bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)]'
                      : 'hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <span className="text-xl leading-none shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C]">
                    {member.avatar || '🎁'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={`text-[15px] font-semibold block truncate ${
                      isSelected
                        ? 'text-[var(--theme-primary)]'
                        : 'text-[#050505] dark:text-[#E4E6EB]'
                    }`}>
                      {member.alias}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {claimStatus && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          claimStatus === 'bought' ? 'bg-[#34C759]' : 'bg-[#FF9500]'
                        }`}
                        title={claimStatus === 'bought' ? 'Gift bought' : 'Want to buy'}
                      />
                    )}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full transition ${
                        isSelected
                          ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                          : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}

            {otherMembers.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-[#65676B] dark:text-[#B0B3B8]">
                No other family members yet.
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('admin')}
                    className="block mx-auto mt-2 text-[var(--theme-primary)] text-sm font-semibold border-0 bg-transparent hover:underline"
                  >
                    Add Members
                  </button>
                )}
              </div>
            )}
          </nav>

          {/* Sidebar footer */}
          <div className="px-4 pt-2 border-t border-[#E4E6EB] dark:border-[#3A3B3C] mt-auto">
            {/* Invite link & User Account */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg leading-none shrink-0">{user?.avatar || '🎁'}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] truncate">
                    {user?.alias}
                  </div>
                  <div className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
                    {family?.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopySidebarInvite}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[var(--theme-primary)] bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] hover:opacity-90 transition border-0"
                  title="Copy invite link"
                >
                  {copiedSidebarLink ? (
                    <>
                      <HugeiconsIcon icon={Tick02Icon} size={12} />
                      Copied
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Link01Icon} size={12} />
                      Invite
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition border-0"
                  title="Sign Out"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ========== MAIN CONTENT AREA ========== */}
        <main className="flex-1 min-w-0 pb-28 lg:pb-8 px-4 lg:px-6 py-4 lg:py-5">
          {/* VIEW: ADD OR EDIT GIFT AS FULL PAGE */}
          {activeTab === 'add-gift' || activeTab === 'edit-gift' ? (
            <ItemFormView
              itemToEdit={activeTab === 'edit-gift' ? itemToEdit : null}
              onSave={handleSaveItem}
              onCancel={() => {
                setActiveTab(itemToEdit && !itemToEdit.is_owner ? 'family-wishes' : 'my-wishes');
                triggerSelection();
              }}
            />
          ) : activeTab === 'settings' ? (
            /* VIEW: SETTINGS AS ENTIRE PAGE */
            <div className="w-full">
              <SettingsView
                onOpenAdmin={() => {
                  setActiveTab('admin');
                  triggerSelection();
                }}
                onBackToWishes={() => {
                  setActiveTab('my-wishes');
                  triggerSelection();
                }}
              />
            </div>
          ) : activeTab === 'admin' ? (
            /* VIEW: FAMILY MANAGEMENT AS ENTIRE PAGE */
            <div className="w-full">
              <AdminView
                onBackToWishes={() => {
                  setActiveTab('my-wishes');
                  triggerSelection();
                }}
                onWishlistReset={handleWishlistReset}
              />
            </div>
          ) : (
            /* VIEW: WISHLISTS (MY WISHES & FAMILY WISHES) */
            <>
              {/* ===== MOBILE: Search & Navigation Bar (Always Accessible on Mobile) ===== */}
              <div className="lg:hidden mb-4 space-y-3 bg-white dark:bg-[#242526] p-3 rounded-xl border border-[#E4E6EB] dark:border-[#3A3B3C]">
                {/* Search bar */}
                <div className="relative">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65676B] dark:text-[#B0B3B8] pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search gifts"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] text-sm rounded-full border-0 focus:ring-0"
                  />
                </div>

                {/* Mobile Tab Switcher */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('my-wishes');
                      triggerSelection();
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs sm:text-sm font-semibold transition border-0 ${
                      activeTab === 'my-wishes'
                        ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                        : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                    }`}
                  >
                    <HugeiconsIcon icon={GiftIcon} size={15} />
                    <span>My Wishlist</span>
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${
                        activeTab === 'my-wishes'
                          ? 'bg-white/25 text-white'
                          : 'bg-black/5 dark:bg-white/10 text-[#65676B] dark:text-[#B0B3B8]'
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
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs sm:text-sm font-semibold transition border-0 ${
                      activeTab === 'family-wishes'
                        ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                        : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                    }`}
                  >
                    <HugeiconsIcon icon={UserGroupIcon} size={15} />
                    <span>Family</span>
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${
                        activeTab === 'family-wishes'
                          ? 'bg-white/25 text-white'
                          : 'bg-black/5 dark:bg-white/10 text-[#65676B] dark:text-[#B0B3B8]'
                      }`}
                    >
                      {otherMembers.length}
                    </span>
                  </button>
                </div>

                {/* Mobile Member Pills (Visible on Family tab) */}
                {activeTab === 'family-wishes' && otherMembers.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide">
                    {otherMembers.map((member) => {
                      const isSelected = selectedMemberId === member.id;
                      const claimStatus = memberClaimStatuses[member.id] ?? member.viewer_claim_status;
                      const count = memberItemCounts[member.id] ?? member.item_count ?? 0;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            triggerSelection();
                            setSelectedMemberId(member.id);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border-0 shrink-0 ${
                            isSelected
                              ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                              : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                          }`}
                        >
                          <span className="text-base leading-none">{member.avatar || '🎁'}</span>
                          <span>{member.alias}</span>
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full transition ${
                              isSelected
                                ? 'bg-white/25 text-white'
                                : 'bg-black/5 dark:bg-white/10 text-[#050505] dark:text-[#E4E6EB]'
                            }`}
                          >
                            {count}
                          </span>
                          {claimStatus && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                claimStatus === 'bought' ? 'bg-[#34C759]' : 'bg-[#FF9500]'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section Header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-xl lg:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight truncate">
                    {sectionTitle}
                  </h2>
                  {activeTab === 'my-wishes' && (
                    <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5 line-clamp-1 sm:line-clamp-none">
                      {family?.name} • Purchases remain secret from you to preserve the surprise
                    </p>
                  )}
                  {activeTab === 'family-wishes' && activeSelectedMember && (
                    <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5 line-clamp-1 sm:line-clamp-none">
                      Mark or buy items to coordinate with family and prevent duplicates
                    </p>
                  )}
                </div>

                {/* Add Gift Button (Navigates to full page) */}
                {activeTab === 'my-wishes' && (
                  <button
                    type="button"
                    onClick={handleOpenAddItem}
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] rounded-lg transition active:scale-[0.98] border-0 shrink-0 shadow-sm"
                  >
                    <HugeiconsIcon icon={Add01Icon} size={16} />
                    <span>Add Gift</span>
                  </button>
                )}
              </div>

              {/* Family Filter Pills (All / Available / Claimed) */}
              {activeTab === 'family-wishes' && items.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {[
                    { key: 'all', label: `All (${items.length})` },
                    { key: 'available', label: `Available (${availableCount})` },
                    { key: 'claimed', label: `Claimed (${claimedCount})` },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFamilyFilter(f.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border-0 ${
                        familyFilter === f.key
                          ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                          : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid Content */}
              {loading ? (
                <div className="py-20 text-center text-[#65676B] dark:text-[#B0B3B8] text-sm flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                  <span>Loading gifts...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16 px-6 bg-[#F0F2F5]/50 dark:bg-[#242526]/50 rounded-2xl border border-[#E4E6EB] dark:border-[#3A3B3C]">
                  <div className="w-16 h-16 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] mx-auto mb-4">
                    <HugeiconsIcon icon={GiftIcon} size={28} />
                  </div>
                  {activeTab === 'my-wishes' ? (
                    <>
                      <h4 className="font-bold text-[#050505] dark:text-[#E4E6EB] text-lg mb-1">
                        Your wishlist is empty
                      </h4>
                      <p className="text-sm text-[#65676B] dark:text-[#B0B3B8] max-w-xs mx-auto mb-4 leading-relaxed">
                        Add items you would love to receive, with links, sizes, or approximate prices.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAddItem}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] rounded-lg transition active:scale-[0.98] border-0 shadow-sm"
                      >
                        <HugeiconsIcon icon={Add01Icon} size={16} />
                        <span>Add Your First Gift</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-[#050505] dark:text-[#E4E6EB] text-lg mb-1">
                        {activeSelectedMember?.alias || 'This member'} hasn't added any wishes yet
                      </h4>
                      <p className="text-sm text-[#65676B] dark:text-[#B0B3B8] max-w-sm mx-auto">
                        Check back soon or remind them to add some gift ideas!
                      </p>
                    </>
                  )}
                </div>
              ) : displayedItems.length === 0 && searchQuery ? (
                <div className="text-center py-12 text-sm text-[#65676B] dark:text-[#B0B3B8]">
                  No gifts matching "{searchQuery}"
                </div>
              ) : displayedItems.length === 0 ? (
                <div className="text-center py-12 text-sm font-medium text-[#65676B] dark:text-[#B0B3B8]">
                  {familyFilter === 'available'
                    ? 'All items on this wishlist have been claimed or bought! 🎉'
                    : 'No claimed items yet.'}
                </div>
              ) : (
                /* ===== MARKETPLACE GRID ===== */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
                  {displayedItems.map((item) => (
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
            </>
          )}
        </main>
      </div>

      {/* ========== MOBILE FIXED BOTTOM NAVIGATION BAR ========== */}
      {/* Ensures wishlists, family, add gift, and settings are ALWAYS accessible anywhere on mobile */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#242526] border-t border-[#E4E6EB] dark:border-[#3A3B3C] px-2 py-1.5 pb-[max(0.5rem,calc(env(safe-area-inset-bottom)+0.25rem))]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* 1. My Wishlist */}
          <button
            type="button"
            onClick={() => {
              triggerSelection();
              setActiveTab('my-wishes');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition border-0 ${
              activeTab === 'my-wishes'
                ? 'text-[var(--theme-primary)] font-bold'
                : 'text-[#65676B] dark:text-[#B0B3B8] font-medium'
            }`}
          >
            <div className="relative">
              <HugeiconsIcon icon={GiftIcon} size={20} />
              {items.length > 0 && activeTab === 'my-wishes' && (
                <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-[var(--theme-primary)] text-white leading-none py-0.5">
                  {items.length}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">My Wishlist</span>
          </button>

          {/* 2. Family Wishlists */}
          <button
            type="button"
            onClick={() => {
              triggerSelection();
              setActiveTab('family-wishes');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition border-0 ${
              activeTab === 'family-wishes'
                ? 'text-[var(--theme-primary)] font-bold'
                : 'text-[#65676B] dark:text-[#B0B3B8] font-medium'
            }`}
          >
            <div className="relative">
              <HugeiconsIcon icon={UserGroupIcon} size={20} />
              {otherMembers.length > 0 && (
                <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] leading-none py-0.5">
                  {otherMembers.length}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">Family</span>
          </button>

          {/* 3. Add Gift Button (Page based) */}
          <button
            type="button"
            onClick={handleOpenAddItem}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition border-0 ${
              activeTab === 'add-gift'
                ? 'text-[var(--theme-primary)] font-bold'
                : 'text-[#65676B] dark:text-[#B0B3B8] font-medium'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-sm">
              <HugeiconsIcon icon={Add01Icon} size={16} />
            </div>
            <span className="text-[11px] leading-tight">Add Gift</span>
          </button>

          {/* 4. Family Admin (If Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                triggerSelection();
                setActiveTab('admin');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition border-0 ${
                activeTab === 'admin'
                  ? 'text-[var(--theme-primary)] font-bold'
                  : 'text-[#65676B] dark:text-[#B0B3B8] font-medium'
              }`}
            >
              <HugeiconsIcon icon={UserSettings01Icon} size={20} />
              <span className="text-[11px] leading-tight">Admin</span>
            </button>
          )}

          {/* 5. Settings */}
          <button
            type="button"
            onClick={() => {
              triggerSelection();
              setActiveTab('settings');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition border-0 ${
              activeTab === 'settings'
                ? 'text-[var(--theme-primary)] font-bold'
                : 'text-[#65676B] dark:text-[#B0B3B8] font-medium'
            }`}
          >
            <HugeiconsIcon icon={Settings02Icon} size={20} />
            <span className="text-[11px] leading-tight">Settings</span>
          </button>
        </div>
      </nav>

      {/* Claim Modal (Kept for interactive claim marking) */}
      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        item={claimTargetItem}
        onSaveClaim={handleSaveClaim}
        onReleaseClaim={handleReleaseClaim}
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
