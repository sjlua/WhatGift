import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import { getChronologicalEvents } from '../constants/salesCalendar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar03Icon,
  FireIcon,
  GiftIcon,
  ShoppingBag01Icon,
  Tag01Icon,
  Search01Icon,
  Clock01Icon,
  SparklesIcon,
  ArrowRight01Icon,
  InformationCircleIcon,
  DeliveryTruck01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';

const ICON_MAP = {
  FireIcon,
  GiftIcon,
  ShoppingBag01Icon,
  Tag01Icon,
  SparklesIcon,
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function CalendarView({ onNavigateToFamily, onBackToWishes }) {
  const { theme, isDark } = useTheme();
  const { triggerSelection, triggerLight } = useHaptics();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'major-deals' | 'holidays' | 'clearance' | 'seasonal'
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | 0 - 11

  // Compute chronological events with current live dates
  const allEvents = useMemo(() => {
    return getChronologicalEvents();
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Category filter
      if (selectedCategory !== 'all' && event.category !== selectedCategory) {
        return false;
      }

      // Month filter
      if (selectedMonth !== 'all') {
        const eventMonth = event.computedNextDate.getMonth();
        if (eventMonth !== selectedMonth) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = event.name.toLowerCase().includes(query);
        const matchesBadge = event.badge.toLowerCase().includes(query);
        const matchesHighlights = event.highlights?.toLowerCase().includes(query);
        const matchesCategories = event.bestFor?.some((cat) => cat.toLowerCase().includes(query));
        const matchesTips = event.proTips?.some((tip) => tip.toLowerCase().includes(query));
        const matchesDate = event.dateLabel.toLowerCase().includes(query);

        return matchesName || matchesBadge || matchesHighlights || matchesCategories || matchesTips || matchesDate;
      }

      return true;
    });
  }, [allEvents, selectedCategory, selectedMonth, searchQuery]);

  // Next upcoming event for the spotlight banner
  const nextUpcomingEvent = useMemo(() => {
    return allEvents.length > 0 ? allEvents[0] : null;
  }, [allEvents]);

  const handleCategoryChange = (cat) => {
    triggerSelection();
    setSelectedCategory(cat);
  };

  const handleMonthChange = (month) => {
    triggerSelection();
    setSelectedMonth(month);
  };

  const clearFilters = () => {
    triggerLight();
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedMonth('all');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ================= PAGE HEADER ================= */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 sm:p-7 border border-[#E4E6EB] dark:border-[#38383A] shadow-apple-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[var(--theme-primary)] flex items-center justify-center text-white shadow-apple-sm shrink-0">
                <HugeiconsIcon icon={Calendar03Icon} size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight">
                  Sales & Holiday Calendar
                </h1>
                <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#8E8E93]">
                  Find the best shopping days and insider advice to buy gifts at lowest prices.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action: Jump to Family Wishlist */}
          {onNavigateToFamily && (
            <button
              type="button"
              onClick={() => {
                triggerSelection();
                onNavigateToFamily();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--theme-primary)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--theme-primary-hover)] active:scale-98 transition shadow-apple-sm border-0 shrink-0"
            >
              <HugeiconsIcon icon={UserGroupIcon} size={16} />
              <span>Browse Family Wishlists</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </button>
          )}
        </div>

        {/* ================= SPOTLIGHT BANNER: NEXT UPCOMING DEAL ================= */}
        {nextUpcomingEvent && !searchQuery && selectedCategory === 'all' && selectedMonth === 'all' && (
          <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] border border-[var(--theme-primary)]/20 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--theme-primary)] text-white shadow-sm">
                    <HugeiconsIcon icon={SparklesIcon} size={12} />
                    Next Up
                  </span>
                  <span className="text-xs font-semibold text-[var(--theme-primary)]">
                    {nextUpcomingEvent.badgeInfo.text}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#050505] dark:text-[#E4E6EB]">
                  {nextUpcomingEvent.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] max-w-2xl">
                  {nextUpcomingEvent.highlights}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4E6EB]/50 dark:border-[#3A3B3C]/50">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-medium text-[#65676B] dark:text-[#8E8E93] block">
                    Expected Discount
                  </span>
                  <span className="text-sm font-extrabold text-[#34C759] dark:text-[#30D158]">
                    {nextUpcomingEvent.discountLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= CONTROLS: SEARCH & CATEGORY PILLS ================= */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#65676B] dark:text-[#8E8E93] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search sales, holidays, tech, toys, or buying tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 sm:h-12 pl-11 pr-10 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E4E6EB] dark:border-[#38383A] text-sm text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                triggerLight();
                setSearchQuery('');
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[#65676B] dark:text-[#8E8E93] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] border-0"
              aria-label="Clear search"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          )}
        </div>

        {/* Category Pills (Segmented filter) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Dates', icon: Calendar03Icon },
            { id: 'major-deals', label: '🔥 Major Deals', icon: FireIcon },
            { id: 'holidays', label: '🎁 Key Holidays', icon: GiftIcon },
            { id: 'clearance', label: '🏷️ Clearance & EOFY', icon: Tag01Icon },
            { id: 'seasonal', label: '☀️ Seasonal', icon: ShoppingBag01Icon },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition border-0 shrink-0 ${
                  isSelected
                    ? 'bg-[var(--theme-primary)] text-white shadow-apple-sm'
                    : 'bg-white dark:bg-[#1C1C1E] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] border border-[#E4E6EB] dark:border-[#38383A]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Month Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => handleMonthChange('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition border-0 shrink-0 ${
              selectedMonth === 'all'
                ? 'bg-[var(--theme-primary)] text-white font-bold'
                : 'bg-[#E4E6EB]/60 dark:bg-[#2C2C2E] text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]'
            }`}
          >
            All Months
          </button>
          {MONTH_NAMES.map((m, idx) => {
            const isSelected = selectedMonth === idx;
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleMonthChange(idx)}
                className={`px-2.5 py-1 rounded-lg font-medium transition border-0 shrink-0 ${
                  isSelected
                    ? 'bg-[var(--theme-primary)] text-white font-bold'
                    : 'bg-[#E4E6EB]/60 dark:bg-[#2C2C2E] text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= RESULTS COUNT & ACTIVE FILTER PILLS ================= */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-[#65676B] dark:text-[#8E8E93]">
          Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'shopping event' : 'shopping events'}
        </span>

        {(selectedCategory !== 'all' || selectedMonth !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-[var(--theme-primary)] hover:underline border-0 bg-transparent"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ================= EVENTS GRID ================= */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredEvents.map((event) => {
            const IconComponent = ICON_MAP[event.iconName] || Calendar03Icon;
            const isImminent = event.daysRemaining <= 14;

            return (
              <div
                key={event.id}
                className={`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 border flex flex-col justify-between transition-all duration-200 hover:shadow-apple-md ${
                  isImminent
                    ? 'border-[var(--theme-primary)]/40 shadow-sm'
                    : 'border-[#E4E6EB] dark:border-[#38383A]'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Icon + Category Badge + Proximity Countdown */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] flex items-center justify-center shrink-0 shadow-apple-sm">
                        <HugeiconsIcon icon={IconComponent} size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-[#65676B] dark:text-[#8E8E93] uppercase tracking-wider block truncate">
                          {event.dateLabel}
                        </span>
                        <h2 className="text-base sm:text-lg font-bold text-[#050505] dark:text-[#E4E6EB] leading-tight truncate">
                          {event.name}
                        </h2>
                      </div>
                    </div>

                    {/* Proximity Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        event.badgeInfo.urgent
                          ? 'bg-[#FF9500]/15 text-[#FF9500] dark:bg-[#FF9500]/20'
                          : isImminent
                          ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)] dark:bg-[var(--theme-tint-dark)]'
                          : 'bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[#65676B] dark:text-[#8E8E93]'
                      }`}
                    >
                      <HugeiconsIcon icon={Clock01Icon} size={11} />
                      {event.badgeInfo.text}
                    </span>
                  </div>

                  {/* Discount & Subtitle */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-[#242526] border border-[#E4E6EB]/60 dark:border-[#38383A]/60">
                    <span className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8]">
                      {event.badge}
                    </span>
                    <span className="text-xs font-extrabold text-[#34C759] dark:text-[#30D158] shrink-0">
                      {event.discountLevel}
                    </span>
                  </div>

                  {/* Best Products to Buy */}
                  {event.bestFor && event.bestFor.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#65676B] dark:text-[#8E8E93] uppercase tracking-wider block">
                        Best Categories to Buy
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {event.bestFor.map((item) => (
                          <span
                            key={item}
                            className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[#050505] dark:text-[#E4E6EB]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pro Buying Tips */}
                  {event.proTips && event.proTips.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-[#65676B] dark:text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
                        <HugeiconsIcon icon={SparklesIcon} size={12} className="text-[var(--theme-primary)]" />
                        Insider Buying Tips
                      </span>
                      <ul className="space-y-1.5">
                        {event.proTips.map((tip, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-[#050505] dark:text-[#E4E6EB] leading-relaxed flex items-start gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] mt-1.5 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Shipping Cutoff Alert */}
                  {event.shippingAlert && (
                    <div className="p-2.5 rounded-xl bg-[#FFF9E6] dark:bg-[#2A2415] border border-[#FFE082]/60 dark:border-[#E5B83B]/30 flex items-start gap-2">
                      <HugeiconsIcon
                        icon={DeliveryTruck01Icon}
                        size={16}
                        className="text-[#D97706] dark:text-[#FBBF24] shrink-0 mt-0.5"
                      />
                      <span className="text-[11px] font-medium text-[#92400E] dark:text-[#FDE68A] leading-tight">
                        {event.shippingAlert}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Callout */}
                <div className="pt-3 mt-4 border-t border-[#E4E6EB]/60 dark:border-[#38383A]/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#65676B] dark:text-[#8E8E93]">
                    WhatGift Smart Buying Guide
                  </span>
                  <span className="font-semibold text-[var(--theme-primary)]">
                    Check Wishlists
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-8 sm:p-12 text-center border border-[#E4E6EB] dark:border-[#38383A] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F0F2F5] dark:bg-[#2C2C2E] flex items-center justify-center text-[#65676B] dark:text-[#8E8E93] mx-auto">
            <HugeiconsIcon icon={Calendar03Icon} size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#050505] dark:text-[#E4E6EB]">
              No sales or holidays found
            </h3>
            <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#8E8E93] max-w-sm mx-auto">
              We couldn't find any shopping dates matching your filters. Try resetting your search or category.
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--theme-primary)] text-white text-xs font-semibold transition hover:bg-[var(--theme-primary-hover)] border-0"
          >
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* ================= SMART BUYING STRATEGY SECTION ================= */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 sm:p-7 border border-[#E4E6EB] dark:border-[#38383A] space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] flex items-center justify-center">
            <HugeiconsIcon icon={InformationCircleIcon} size={18} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#050505] dark:text-[#E4E6EB]">
            How to Use This Calendar with WhatGift
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#242526] border border-[#E4E6EB]/60 dark:border-[#38383A]/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#050505] dark:text-[#E4E6EB]">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-[#34C759]" />
              <span>1. Check Family Wishlists Early</span>
            </div>
            <p className="text-[#65676B] dark:text-[#B0B3B8] leading-relaxed">
              Open your family’s lists before Black Friday, Prime Day, or EOFY sales so you know exact items, sizes, and colors they want.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#242526] border border-[#E4E6EB]/60 dark:border-[#38383A]/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#050505] dark:text-[#E4E6EB]">
              <HugeiconsIcon icon={Tag01Icon} size={16} className="text-[var(--theme-primary)]" />
              <span>2. Claim While You Shop</span>
            </div>
            <p className="text-[#65676B] dark:text-[#B0B3B8] leading-relaxed">
              When you spot a sale price and purchase an item, mark it as "Bought" in WhatGift so no other family member accidentally doubles up!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#242526] border border-[#E4E6EB]/60 dark:border-[#38383A]/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#050505] dark:text-[#E4E6EB]">
              <HugeiconsIcon icon={DeliveryTruck01Icon} size={16} className="text-[#FF9500]" />
              <span>3. Watch Shipping Cutoffs</span>
            </div>
            <p className="text-[#65676B] dark:text-[#B0B3B8] leading-relaxed">
              During November and December, standard domestic deliveries slow down. Aim to complete holiday orders by mid-December.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
