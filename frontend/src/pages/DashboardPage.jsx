import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { api } from '../api/client';
import { useIsDesktop } from '../hooks/useMediaQuery';
import Navbar from '../components/Navbar';
import WishlistCard from '../components/WishlistCard';
import ItemModal from '../components/ItemModal';
import ClaimModal from '../components/ClaimModal';
import AdminModal from '../components/AdminModal';
import ProfileModal from '../components/ProfileModal';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  UserGroupIcon,
  Add01Icon,
  ViewOffIcon,
  Shield01Icon,
} from '@hugeicons/core-free-icons';

export default function DashboardPage() {
  const { user, family, isAdmin, logout, refreshFamily } = useAuth();
  const { theme, isDark } = useTheme();
  const { triggerSelection, triggerSuccess, triggerWarning } = useHaptics();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    refreshFamily();
  }, []);

  const [activeTab, setActiveTab] = useState('my-wishes'); // 'my-wishes' | 'family-wishes'
  const [selectedMemberId, setSelectedMemberId] = useState(null);
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

  // Other members in family (excluding the current user)
  const otherMembers = family?.members?.filter((m) => m.id !== user.id) || [];
  const [memberItemCounts, setMemberItemCounts] = useState({});

  useEffect(() => {
    if (family?.members) {
      const counts = {};
      family.members.forEach((m) => {
        if (m.item_count !== undefined) {
          counts[m.id] = m.item_count;
        }
      });
      setMemberItemCounts((prev) => ({ ...counts, ...prev }));
    }
  }, [family]);

  // When switching to family tab, default selected member to first other member if none selected
  useEffect(() => {
    if (activeTab === 'family-wishes' && !selectedMemberId && otherMembers.length > 0) {
      setSelectedMemberId(otherMembers[0].id);
    }
  }, [activeTab, otherMembers, selectedMemberId]);

  // Load wishlist items whenever activeTab or selectedMemberId changes
  const loadItems = async () => {
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

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this gift from your wishlist?')) return;
    try {
      await api.deleteItem(itemId);
      triggerWarning();
      await loadItems();
    } catch (err) {
      alert(err.message || 'Failed to delete item');
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
  };

  const handleReleaseClaim = async (itemId) => {
    await api.unclaimItem(itemId);
    triggerWarning();
    await loadItems();
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
    } catch (err) {
      alert(err.message || 'Failed to mark gift');
    }
  };

  const activeSelectedMember = otherMembers.find((m) => m.id === selectedMemberId);

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] flex flex-col pb-24 lg:pb-16 transition-colors duration-200 relative overflow-x-hidden">
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
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSwitchUser={logout}
      />

      {/* Main Container - Responsive width from mobile to large desktop displays */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex-1 relative z-10">
        {/* Top Control Bar: High-Visibility Segmented Tabs + Desktop Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          {/* Segmented Tabs with Clean Apple HIG Styling (Less Outline Borders) */}
          <div className="flex gap-2 p-1.5 bg-[#E5E5EA]/70 dark:bg-[#1C1C1E] rounded-2xl shadow-inner w-full sm:w-auto border-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('my-wishes');
                triggerSelection();
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm transition-all duration-150 border-0 ${
                activeTab === 'my-wishes'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-apple-tab font-bold ring-1 ring-black/[0.04]'
                  : 'text-[#636366] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 font-semibold'
              }`}
            >
              <HugeiconsIcon icon={GiftIcon} size={17} />
              <span>My Wishlist</span>
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full border-0 transition ${
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm transition-all duration-150 border-0 ${
                activeTab === 'family-wishes'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-apple-tab font-bold ring-1 ring-black/[0.04]'
                  : 'text-[#636366] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 font-semibold'
              }`}
            >
              <HugeiconsIcon icon={UserGroupIcon} size={17} />
              <span>Family Wishlists</span>
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full border-0 transition ${
                  activeTab === 'family-wishes'
                    ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)] font-bold'
                    : 'bg-[#767680]/15 dark:bg-[#38383A] text-[#636366] dark:text-[#8E8E93] font-medium'
                }`}
              >
                {otherMembers.length}
              </span>
            </button>
          </div>

          {/* Desktop Action Area */}
          <div className="hidden sm:flex items-center gap-2.5">
            {activeTab === 'my-wishes' && (
              <>
                {/* Top Secret Info Tooltip Button */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      triggerSelection();
                      setShowSecretTooltip((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-apple-sm transition border-0 text-xs font-semibold"
                    aria-label="Top Secret Information"
                    title="Top Secret info"
                  >
                    <HugeiconsIcon icon={ViewOffIcon} size={16} className="text-[var(--theme-primary)]" />
                    <span>Top Secret</span>
                  </button>

                  {/* Desktop Tooltip Popover */}
                  <div
                    className={`absolute right-0 top-full mt-2 w-72 p-3.5 rounded-2xl bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl shadow-apple-lg border border-black/5 dark:border-white/10 text-xs z-50 transition-all duration-150 ${
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
                          className="text-[10px] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white font-normal"
                        >
                          Dismiss
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-95"
                >
                  <HugeiconsIcon icon={Add01Icon} size={18} />
                  <span>Add Gift</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* TAB 1: MY WISHLIST */}
        {activeTab === 'my-wishes' && (
          <div className="space-y-6">
            {/* Responsive Desktop Grid: 1 col (mobile) -> 2 cols (tablet) -> 3 cols (desktop) -> 4 cols (large widescreen) */}
            {loading ? (
              <div className="py-24 text-center text-[#8E8E93] text-sm flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                <span>Loading your gifts...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border-0 shadow-apple-card w-full">
                <div className="w-16 h-16 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93] mx-auto mb-3 shadow-apple-sm">
                  <HugeiconsIcon icon={GiftIcon} size={30} />
                </div>
                <h4 className="font-heading font-normal text-[#1C1C1E] dark:text-white text-lg mb-1">
                  Your wishlist is empty
                </h4>
                <p className="text-xs sm:text-sm text-[#8E8E93] max-w-xs mx-auto mb-5 leading-relaxed font-sans">
                  Add items you would love to receive, with links, sizes, or approximate prices.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddItem}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-95"
                >
                  <HugeiconsIcon icon={Add01Icon} size={18} /> Add Your First Gift
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 items-start">
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

        {/* TAB 2: FAMILY WISHLISTS (RESPONSIVE SPLIT-VIEW ON DESKTOP) */}
        {activeTab === 'family-wishes' && (
          <div>
            {otherMembers.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border-0 shadow-apple-card max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93] mx-auto mb-3 shadow-apple-sm">
                  <HugeiconsIcon icon={UserGroupIcon} size={28} />
                </div>
                <h4 className="font-bold text-[#1C1C1E] dark:text-white text-lg mb-1">No other family members yet</h4>
                <p className="text-xs sm:text-sm text-[#8E8E93] max-w-xs mx-auto mb-5 leading-relaxed">
                  {isAdmin
                    ? 'Use the Manage Family panel to add members to your family.'
                    : 'Ask your family admin to invite other family members.'}
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(true)}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 rounded-xl shadow-apple-md transition"
                  >
                    Add Members
                  </button>
                )}
              </div>
            ) : (
              /* Split Layout: On Large Desktop screens, render a dedicated Apple-style Sidebar */
              <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 items-start">
                {/* 1. Member Selector: Horizontal Swipeable on Mobile, Sticky Sidebar on Desktop */}
                <div className="mb-6 lg:mb-0">
                  {/* Mobile View: Horizontal Scroll Pills */}
                  <div className="lg:hidden">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-2">
                      Select Member:
                    </p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {otherMembers.map((member) => {
                        const count = memberItemCounts[member.id] ?? member.item_count ?? 0;
                        const isSelected = selectedMemberId === member.id;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setSelectedMemberId(member.id)}
                            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-bold shrink-0 transition-all border-0 shadow-apple-sm ${
                              isSelected
                                ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-apple-md ring-2 ring-black/10 dark:ring-white/10'
                                : 'bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]'
                            }`}
                          >
                            <span className="text-base leading-none">{member.avatar || '🎁'}</span>
                            <span>{member.alias}</span>
                            <span
                              className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                                isSelected
                                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#1C1C1E]'
                                  : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93]'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop View: Dedicated Sidebar Card */}
                  <div className="hidden lg:block bg-white dark:bg-[#1C1C1E] rounded-3xl border-0 shadow-apple-card p-4 sticky top-24">
                    <div className="flex items-center justify-between px-2 mb-3 pb-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                        Family Members
                      </span>
                      <span className="text-xs font-semibold text-[#8E8E93] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2 py-0.5 rounded-full border-0">
                        {otherMembers.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {otherMembers.map((member) => {
                        const isSelected = selectedMemberId === member.id;
                        const count = memberItemCounts[member.id] ?? member.item_count ?? 0;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setSelectedMemberId(member.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-150 border-0 ${
                              isSelected
                                ? 'bg-[var(--theme-primary)] text-white shadow-apple-md font-bold'
                                : 'bg-transparent hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white font-semibold'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl leading-none">{member.avatar || '🎁'}</span>
                              <div>
                                <div className="text-sm leading-tight">{member.alias}</div>
                                <div
                                  className={`text-[11px] mt-0.5 ${
                                    isSelected ? 'text-white/80' : 'text-[#8E8E93]'
                                  }`}
                                >
                                  {count} {count === 1 ? 'gift' : 'gifts'}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                                isSelected
                                  ? 'bg-white/25 text-white'
                                  : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93]'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Main Content: Selected Member's Wishlist */}
                <div>
                  {/* Active Member Header Card */}
                  {activeSelectedMember && (
                    <div className="flex items-center justify-between p-4 sm:p-0 rounded-2xl bg-white dark:bg-[#1C1C1E] border-0 shadow-apple-sm mb-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-2xl shadow-apple-sm border-0">
                          {activeSelectedMember.avatar || '🎁'}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-[#1C1C1E] dark:text-white">
                            {activeSelectedMember.alias}'s Wishlist
                          </h3>
                          <p className="text-xs text-[#8E8E93]">
                            Claim items to coordinate with family and prevent duplicate gifts.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#636366] dark:text-[#E5E5EA] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-1 rounded-xl shadow-apple-sm border-0">
                        {items.length} {items.length === 1 ? 'gift' : 'gifts'}
                      </span>
                    </div>
                  )}

                  {/* Grid of Wishlist Items */}
                  {loading ? (
                    <div className="py-24 text-center text-[#8E8E93] text-sm flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                      <span>Loading {activeSelectedMember?.alias}'s wishlist...</span>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border-0 shadow-apple-card w-full">
                      <div className="w-14 h-14 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93] mx-auto mb-3 shadow-apple-sm">
                        <HugeiconsIcon icon={GiftIcon} size={28} />
                      </div>
                      <h4 className="font-bold text-[#1C1C1E] dark:text-white text-base sm:text-lg mb-1">
                        {activeSelectedMember?.alias || 'This member'} hasn't added any wishes yet
                      </h4>
                      <p className="text-xs sm:text-sm text-[#8E8E93] max-w-sm mx-auto">
                        Check back soon or remind them to add some ideas!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 items-start">
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
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Floating Action Controls */}
      {activeTab === 'my-wishes' && (
        <div className="sm:hidden fixed bottom-6 right-6 z-30 flex flex-col items-center gap-2.5">
          {/* Top Secret Info Tooltip Button (Above Add Gift FAB) */}
          <div className="relative">
            {showMobileSecretTooltip && (
              <div
                className="absolute right-0 bottom-full mb-2 w-64 p-3.5 rounded-2xl bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl shadow-apple-lg border border-black/5 dark:border-white/10 text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
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
                    className="text-[10px] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                  >
                    Dismiss
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
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
