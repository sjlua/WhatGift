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
  DeliveryTruck01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';

const ICON_MAP = {
  FireIcon,
  GiftIcon,
  ShoppingBag01Icon,
  Tag01Icon,
  SparklesIcon,
};

const CATEGORIES = [
  { id: 'all', label: 'All Dates', icon: Calendar03Icon },
  { id: 'major-deals', label: 'Major Sales', icon: FireIcon },
  { id: 'holidays', label: 'Holidays', icon: GiftIcon },
  { id: 'clearance', label: 'Clearance', icon: Tag01Icon },
  { id: 'seasonal', label: 'Seasonal', icon: ShoppingBag01Icon },
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function CalendarView() {
  const { theme } = useTheme();
  const { triggerSelection, triggerLight } = useHaptics();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const allEvents = useMemo(() => {
    return getChronologicalEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (selectedCategory !== 'all' && event.category !== selectedCategory) {
        return false;
      }

      if (selectedMonth !== 'all') {
        const eventMonth = event.computedNextDate.getMonth();
        if (eventMonth !== selectedMonth) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = event.name.toLowerCase().includes(query);
        const matchesBadge = event.badge?.toLowerCase().includes(query);
        const matchesCategories = event.bestFor?.some((cat) => cat.toLowerCase().includes(query));
        const matchesDate = event.dateLabel.toLowerCase().includes(query);
        const matchesShipping = event.shippingAlert?.toLowerCase().includes(query);

        return matchesName || matchesBadge || matchesCategories || matchesDate || matchesShipping;
      }

      return true;
    });
  }, [allEvents, selectedCategory, selectedMonth, searchQuery]);

  const handleCategoryChange = (catId) => {
    triggerSelection();
    setSelectedCategory(catId);
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
    <div className="w-full space-y-4 animate-tab-fade">
      {/* Top Header - Consistent with SettingsView & AdminView */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight">
            Sales & Holiday Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
            Key shopping dates and delivery cutoffs to plan wishlist purchases
          </p>
        </div>
      </div>

      {/* Controls: Search Bar + Filter Pills */}
      <div className="space-y-2.5">
        {/* Outlined Search Bar */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65676B] dark:text-[#8E8E93] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search dates, holidays, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-9 rounded-full bg-white dark:bg-black border border-[#CCD0D5] dark:border-[#38383A] text-xs sm:text-sm text-[#050505] dark:text-[#E4E6EB] placeholder-[#65676B] dark:placeholder-[#8E8E93] focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] shadow-sm transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                triggerLight();
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[#65676B] dark:text-[#8E8E93] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] border-0"
              aria-label="Clear search"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={13} />
            </button>
          )}
        </div>

        {/* Category Filter Pills (Vector Hugeicons only, zero emojis) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border-0 shrink-0 ${
                  isSelected
                    ? 'bg-[var(--theme-primary)] text-white shadow-apple-xs'
                    : 'bg-white dark:bg-[#1C1C1E] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#F0F2F5] dark:hover:bg-[#2C2C2E] border border-[#CCD0D5] dark:border-[#38383A]'
                }`}
              >
                <HugeiconsIcon icon={Icon} size={14} />
                <span>{cat.label}</span>
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
                : 'bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#38383A]'
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
                    : 'bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#38383A]'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Status */}
      <div className="flex items-center justify-between px-0.5 text-xs">
        <span className="font-semibold text-[#65676B] dark:text-[#8E8E93]">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'date' : 'dates'}
        </span>

        {(selectedCategory !== 'all' || selectedMonth !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={clearFilters}
            className="font-semibold text-[var(--theme-primary)] hover:underline border-0 bg-transparent"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Minimal Events Grid: Small, compact cards with less padding */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.map((event) => {
            const IconComponent = ICON_MAP[event.iconName] || Calendar03Icon;
            const isImminent = event.daysRemaining <= 14;

            return (
              <div
                key={event.id}
                className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-3.5 border transition-all duration-150 flex flex-col justify-between gap-2.5 ${
                  isImminent
                    ? 'border-[var(--theme-primary)]/40 shadow-apple-xs'
                    : 'border-[#E4E6EB] dark:border-[#38383A]'
                }`}
              >
                <div className="space-y-2">
                  {/* Card Header: Icon + Title + Countdown Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] flex items-center justify-center shrink-0">
                        <HugeiconsIcon icon={IconComponent} size={16} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-[#050505] dark:text-[#E4E6EB] leading-tight truncate">
                          {event.name}
                        </h2>
                        <span className="text-[11px] text-[#65676B] dark:text-[#8E8E93] block truncate">
                          {event.dateLabel}
                        </span>
                      </div>
                    </div>

                    {/* Proximity / Days remaining badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        event.badgeInfo.urgent
                          ? 'bg-[#FF9500]/15 text-[#FF9500]'
                          : isImminent
                          ? 'bg-[var(--theme-tint)] text-[var(--theme-primary)]'
                          : 'bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[#65676B] dark:text-[#8E8E93]'
                      }`}
                    >
                      <HugeiconsIcon icon={Clock01Icon} size={10} />
                      {event.badgeInfo.text}
                    </span>
                  </div>

                  {/* Discount & Category Chips */}
                  <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[11px] font-bold text-[#34C759] dark:text-[#30D158] bg-[#34C759]/10 px-2 py-0.5 rounded-md shrink-0">
                      {event.discountLevel}
                    </span>
                    {event.bestFor?.map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-medium text-[#65676B] dark:text-[#8E8E93] bg-[#F0F2F5] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded-md"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Shipping Cutoff Suggestion (kept as requested, concise & minimal) */}
                {event.shippingAlert && (
                  <div className="flex items-start gap-1.5 p-2 rounded-xl bg-[#FFF9E6] dark:bg-[#2A2415] text-[11px] text-[#92400E] dark:text-[#FDE68A] leading-snug">
                    <HugeiconsIcon
                      icon={DeliveryTruck01Icon}
                      size={14}
                      className="text-[#D97706] dark:text-[#FBBF24] shrink-0 mt-0.5"
                    />
                    <span>{event.shippingAlert}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-8 text-center border border-[#E4E6EB] dark:border-[#38383A] space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#F0F2F5] dark:bg-[#2C2C2E] flex items-center justify-center text-[#65676B] dark:text-[#8E8E93] mx-auto">
            <HugeiconsIcon icon={Calendar03Icon} size={20} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#050505] dark:text-[#E4E6EB]">
              No dates found
            </h3>
            <p className="text-xs text-[#65676B] dark:text-[#8E8E93]">
              No shopping dates match your current filter.
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-primary)] text-white text-xs font-semibold transition hover:bg-[var(--theme-hover)] border-0"
          >
            <span>Reset Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
