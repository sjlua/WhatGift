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
import SetupHelpModal from '../components/SetupHelpModal';
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
  CircleQuestionMarkIcon,
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
  const [showSetupHelp, setShowSetupHelp] = useState(false);

  // Whether item deletion is permitted in this family
  const allowItemDeletion = family?.allow_item_deletion !== false;
  const canDelete = allowItemDeletion || isAdmin;

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

  // Immediate fresh sync whenever active tab or family selection changes
  useEffect(() => {
    loadItems();
  }, [activeTab, selectedMemberId]);

  // Navigation Handlers
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
      if (activeTab === 'edit-gift') {
        setActiveTab('my-wishes');
        setItemToEdit(null);
      }
      await loadItems();
      await refreshFamily();
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

  // One-tap quick mark as bought directly from card
  const handleQuickMark = async (item) => {
    triggerSuccess();
    const isBought = item.claim?.status === 'bought' || item.claim?.status === 'purchased';
    const newStatus = isBought ? 'want_to_buy' : 'bought';
    try {
      await api.updateClaim(item.id, { status: newStatus });
      await loadItems();
      await refreshFamily();
    } catch (err) {
      setAlertMessage(err.message || 'Failed to update claim');
    }
  };

  const handleWishlistReset = async () => {
    setItems([]);
    await refreshFamily();
  };

  // Currently viewed member in 'family-wishes' tab
  const activeSelectedMember = otherMembers.find((m) => m.id === selectedMemberId) || otherMembers[0];

  // Client-side search filtering
  const searchFiltered = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  // Client-side claim filtering for family tab
  const displayedFamilyItems = searchFiltered.filter((item) => {
    if (familyFilter === 'all') return true;
    const isClaimed = Boolean(item.claim);
    if (familyFilter === 'claimed') return isClaimed;
    if (familyFilter === 'available') return !isClaimed;
    return true;
  });

  const displayedItems = activeTab === 'family-wishes' ? displayedFamilyItems : searchFiltered;

  // Header Titles
  const sectionTitle = activeTab === 'my-wishes'
    ? 'My Wishlist'
    : activeTab === 'family-wishes'
    ? `${activeSelectedMember ? activeSelectedMember.alias + "'s Wishlist" : 'Family Wishlists'}`
    : activeTab === 'settings'
    ? 'Settings & Preferences'
    : activeTab === 'admin'
    ? 'Manage Family'
    : activeTab === 'edit-gift'
    ? 'Edit Gift'
    : 'Add New Gift';

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] text-[#050505] dark:text-[#E4E6EB] transition-colors duration-150">
      {/* Top Application Navbar */}
      <Navbar
        onOpenAdd={handleOpenAddItem}
        onOpenAdmin={() => {
          triggerSelection();
          setActiveTab('admin');
        }}
        onOpenSettings={() => {
          triggerSelection();
          setActiveTab('settings');
        }}
        onOpenSetupHelp={() => setShowSetupHelp(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="max-w-7xl mx-auto flex">
        {/* ========== DESKTOP SIDEBAR ========== */}
        <aside
          aria-label="Sidebar Navigation"
          className="hidden lg:flex flex-col w-72 shrink-0 border-r border-[#E4E6EB] dark:border-[#3A3B3C] min-h-[calc(100vh-3.5rem)] p-4 space-y-4 sticky top-14 self-start bg-transparent"
        >
          {/* User Quick Info */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#242526] border-0 shadow-apple-sm flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center justify-center text-xl shrink-0">
                {user?.avatar || '🎁'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-[#050505] dark:text-[#E4E6EB] truncate">
                  {user?.alias}
                </div>
                <div className="text-xs text-[#65676B] dark:text-[#B0B3B8] truncate">
                  {family?.name}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerSelection();
                setActiveTab('settings');
              }}
              className={`p-2 rounded-lg transition border-0 ${
                activeTab === 'settings'
                  ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)]'
                  : 'text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]'
              }`}
              title="Personal Settings"
            >
              <HugeiconsIcon icon={Settings02Icon} size={18} />
            </button>
          </div>

          {/* Primary Nav Links */}
          <div className="space-y-1">
            {/* 1. My Wishlist Button */}
            <button
              type="button"
              onClick={() => {
                triggerSelection();
                setActiveTab('my-wishes');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition border-0 ${
                activeTab === 'my-wishes'
                  ? 'bg-white dark:bg-[#242526] text-[var(--theme-primary)] shadow-apple-sm font-bold'
                  : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon
                  icon={GiftIcon}
                  size={19}
                  className={activeTab === 'my-wishes' ? 'text-[var(--theme-primary)]' : 'text-[#65676B] dark:text-[#B0B3B8]'}
                />
                <span>My Wishlist</span>
              </div>
              {memberItemCounts[user?.id] !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'my-wishes'
                    ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)]'
                    : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#65676B] dark:text-[#B0B3B8]'
                }`}>
                  {memberItemCounts[user?.id]}
                </span>
              )}
            </button>

            {/* 2. Add New Gift Button */}
            <button
              type="button"
              onClick={handleOpenAddItem}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition border-0 ${
                activeTab === 'add-gift'
                  ? 'bg-white dark:bg-[#242526] text-[var(--theme-primary)] shadow-apple-sm font-bold'
                  : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                size={19}
                className={activeTab === 'add-gift' ? 'text-[var(--theme-primary)]' : 'text-[#65676B] dark:text-[#B0B3B8]'}
              />
              <span>Add New Gift</span>
            </button>

            {/* 3. Manage Family (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  triggerSelection();
                  setActiveTab('admin');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition border-0 ${
                  activeTab === 'admin'
                    ? 'bg-white dark:bg-[#242526] text-[var(--theme-primary)] shadow-apple-sm font-bold'
                    : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HugeiconsIcon
                    icon={UserSettings01Icon}
                    size={19}
                    className={activeTab === 'admin' ? 'text-[var(--theme-primary)]' : 'text-[#65676B] dark:text-[#B0B3B8]'}
                  />
                  <span>Manage Family</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--theme-tint)] text-[var(--theme-primary)]">
                  Admin
                </span>
              </button>
            )}
          </div>

          {/* Family Directory Section */}
          <div className="pt-2 border-t border-[#E4E6EB] dark:border-[#3A3B3C] space-y-2">
            <div className="flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider text-[#65676B] dark:text-[#B0B3B8]">
              <span>Family Members</span>
              <span>{otherMembers.length}</span>
            </div>

            {otherMembers.length === 0 ? (
              <div className="p-3 rounded-lg bg-white dark:bg-[#242526] text-xs text-[#65676B] dark:text-[#B0B3B8] leading-relaxed shadow-apple-xs">
                No other members yet. Copy your family code <strong>{family?.code}</strong> to invite them!
              </div>
            ) : (
              <div className="space-y-1">
                {otherMembers.map((member) => {
                  const isSelected = activeTab === 'family-wishes' && selectedMemberId === member.id;
                  const count = memberItemCounts[member.id] || 0;
                  const claimStatus = memberClaimStatuses[member.id];

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        triggerSelection();
                        setSelectedMemberId(member.id);
                        setActiveTab('family-wishes');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition border-0 ${
                        isSelected
                          ? 'bg-white dark:bg-[#242526] text-[var(--theme-primary)] shadow-apple-sm font-bold'
                          : 'text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-lg shrink-0">{member.avatar || '🎁'}</span>
                        <span className="truncate">{member.alias}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {claimStatus === 'bought' && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#34C759] shadow-sm"
                            title="You have purchased gifts for this member"
                          />
                        )}
                        {claimStatus === 'want_to_buy' && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#FF9500] shadow-sm"
                            title="You have claimed gifts for this member"
                          />
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isSelected
                            ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)]'
                            : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#65676B] dark:text-[#B0B3B8]'
                        }`}>
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Invite Link Banner */}
          <div className="mt-auto pt-3 border-t border-[#E4E6EB] dark:border-[#3A3B3C]">
            <button
              type="button"
              onClick={handleCopySidebarInvite}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] bg-white dark:bg-[#242526] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] transition border-0 shadow-apple-xs"
            >
              <HugeiconsIcon icon={copiedSidebarLink ? Tick02Icon : Link01Icon} size={15} />
              <span>{copiedSidebarLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
            </button>
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
              onDelete={handleDeleteItem}
              canDelete={canDelete}
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
                onOpenSetupHelp={() => setShowSetupHelp(true)}
              />
            </div>
          ) : (
            /* VIEW: MARKETPLACE WISHLIST FEED */
            <>
              {/* Feed Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C] mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight">
                    {sectionTitle}
                  </h1>
                  {activeTab === 'my-wishes' && (
                    <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                      Gifts you would love to receive. Claims stay confidential to preserve surprise!
                    </p>
                  )}
                  {activeTab === 'family-wishes' && activeSelectedMember && (
                    <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                      Secretly coordinate gifts. {activeSelectedMember.alias} will never see claim statuses!
                    </p>
                  )}
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                  {activeTab === 'my-wishes' && (
                    <button
                      type="button"
                      onClick={handleOpenAddItem}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] rounded-lg transition active:scale-95 border-0 shadow-sm"
                    >
                      <HugeiconsIcon icon={Add01Icon} size={16} />
                      <span>Add Gift</span>
                    </button>
                  )}

                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search gifts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-36 sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#242526] border border-[#CCD0D5] dark:border-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#B0B3B8] focus:outline-none focus:border-[var(--theme-primary)]"
                    />
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#65676B] dark:text-[#B0B3B8]"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Horizontal Member Scroll Bar (only on family tab) */}
              {activeTab === 'family-wishes' && otherMembers.length > 0 && (
                <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar -mx-4 px-4">
                  {otherMembers.map((member) => {
                    const isSelected = selectedMemberId === member.id;
                    const count = memberItemCounts[member.id] || 0;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          triggerSelection();
                          setSelectedMemberId(member.id);
                        }}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border-0 shrink-0 ${
                          isSelected
                            ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                            : 'bg-white dark:bg-[#242526] text-[#050505] dark:text-[#E4E6EB]'
                        }`}
                      >
                        <span>{member.avatar || '🎁'}</span>
                        <span>{member.alias}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#65676B] dark:text-[#B0B3B8]'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Claim Filter Segmented Pills (only on family tab when items exist) */}
              {activeTab === 'family-wishes' && items.length > 0 && (
                <div className="flex items-center gap-1.5 pb-3">
                  {[
                    { key: 'all', label: 'All Wishes' },
                    { key: 'available', label: 'Unclaimed' },
                    { key: 'claimed', label: 'Claimed' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        triggerSelection();
                        setFamilyFilter(f.key);
                      }}
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
                <div className="text-center py-16 px-6 bg-[#F0F2F5]/50 dark:bg-[#242526]/50 rounded-2xl border-0 shadow-apple-sm">
                  <div className="w-16 h-16 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] mx-auto mb-4">
                    <HugeiconsIcon icon={GiftIcon} size={28} />
                  </div>
                  {activeTab === 'my-wishes' ? (
                    <>
                      <h4 className="font-bold text-[#050505] dark:text-[#E4E6EB] text-lg mb-1">
                        Your wishlist is empty
                      </h4>
                      <p className="text-sm text-[#65676B] dark:text-[#B0B3B8] max-w-xs mx-auto mb-4 leading-relaxed">
                        Add items you would love to receive, with links, sizes and prices.
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
                      onDelete={handleDeleteItem}
                      canDelete={canDelete}
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
                <span className="absolute -top-1 -right-2 text-[10px] px-1 bg-[var(--theme-primary)] text-white rounded-full font-bold">
                  {items.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">My List</span>
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
                <span className="absolute -top-1 -right-2 text-[10px] px-1 bg-[#65676B] dark:bg-[#3A3B3C] text-white rounded-full font-bold">
                  {otherMembers.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">Family</span>
          </button>

          {/* 3. Add Gift */}
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
            <span className="text-[10px]">Add</span>
          </button>

          {/* 4. Admin Management (Admin only) */}
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
              <span className="text-[10px]">Manage</span>
            </button>
          )}

          {/* 5. Settings & Appearance */}
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
            <span className="text-[10px]">Settings</span>
          </button>
        </div>
      </nav>

      {/* Secret Claim Modal */}
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
        cancelText=""
        onConfirm={() => setAlertMessage(null)}
        onCancel={() => setAlertMessage(null)}
      />

      {/* Setup Guide Modal */}
      <SetupHelpModal
        isOpen={showSetupHelp}
        onClose={() => setShowSetupHelp(false)}
      />
    </div>
  );
}
