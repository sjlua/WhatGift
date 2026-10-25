import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useHaptics } from '../context/HapticsContext';
import {
  getEventsForMonth,
  getEventsForDay,
  getNextUpcomingEvent,
} from '../constants/salesCalendar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar03Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FireIcon,
  GiftIcon,
  ShoppingBag01Icon,
  Tag01Icon,
  SparklesIcon,
  Clock01Icon,
  DeliveryTruck01Icon,
} from '@hugeicons/core-free-icons';

const ICON_MAP = {
  FireIcon,
  GiftIcon,
  ShoppingBag01Icon,
  Tag01Icon,
  SparklesIcon,
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarView() {
  const { theme } = useTheme();
  const { triggerSelection, triggerLight } = useHaptics();

  // Current real-world date
  const today = useMemo(() => new Date(), []);
  
  // Currently displayed year and month
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  
  // Selected day in the calendar grid (null = view whole month)
  const [selectedDay, setSelectedDay] = useState(null);

  // Next overall upcoming event for quick reference
  const nextUpcoming = useMemo(() => getNextUpcomingEvent(today), [today]);

  // All events occurring in the currently viewed month
  const monthEvents = useMemo(() => {
    return getEventsForMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Events on the selected day (if a day is tapped)
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return getEventsForDay(currentYear, currentMonth, selectedDay);
  }, [currentYear, currentMonth, selectedDay]);

  // Build the 7-column calendar matrix
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Convert Sunday=0 to Monday=0
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Trailing days from previous month
    for (let i = startDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        events: [],
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(currentYear, currentMonth, day);
      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      cells.push({
        day,
        isCurrentMonth: true,
        isToday,
        events: dayEvents,
      });
    }

    // Leading days from next month to complete rows
    const totalCells = Math.ceil(cells.length / 7) * 7;
    let nextMonthDay = 1;
    while (cells.length < totalCells) {
      cells.push({
        day: nextMonthDay++,
        isCurrentMonth: false,
        events: [],
      });
    }

    return cells;
  }, [currentYear, currentMonth, today]);

  // Navigation handlers
  const handlePrevMonth = () => {
    triggerSelection();
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    triggerSelection();
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    triggerLight();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const handleSelectDay = (day) => {
    triggerSelection();
    setSelectedDay(selectedDay === day ? null : day);
  };

  const isCurrentMonthActive =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  return (
    <div className="w-full space-y-4 animate-tab-fade">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E4E6EB] dark:border-[#38383A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] tracking-tight">
            Sales & Holiday Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
            Key shopping dates and shipping cutoffs to plan wishlist purchases
          </p>
        </div>

        {/* Quick Jump: Today Button */}
        {!isCurrentMonthActive && (
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] transition border-0 active:scale-95 shrink-0"
          >
            Today
          </button>
        )}
      </div>

      {/* Calendar Controls & Month Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#1C1C1E] p-3 sm:p-4 rounded-2xl border border-[#E4E6EB] dark:border-[#38383A] shadow-apple-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={Calendar03Icon} size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#050505] dark:text-[#E4E6EB] leading-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <span className="text-[11px] text-[#65676B] dark:text-[#8E8E93]">
              {monthEvents.length === 0
                ? 'No major retail events this month'
                : `${monthEvents.length} shopping ${monthEvents.length === 1 ? 'event' : 'events'}`}
            </span>
          </div>
        </div>

        {/* Month Arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] transition border-0 active:scale-95"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] transition border-0 active:scale-95"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-[#E4E6EB] dark:border-[#38383A] shadow-apple-xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-[#E4E6EB] dark:border-[#38383A] bg-[#F8F9FA] dark:bg-[#242526]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[11px] sm:text-xs font-semibold text-[#65676B] dark:text-[#8E8E93]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 7-Column Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#E4E6EB]/60 dark:divide-[#38383A]/60">
          {calendarCells.map((cell, idx) => {
            const hasEvents = cell.events.length > 0;
            const isSelected = selectedDay === cell.day && cell.isCurrentMonth;

            return (
              <button
                key={idx}
                type="button"
                disabled={!cell.isCurrentMonth}
                onClick={() => cell.isCurrentMonth && handleSelectDay(cell.day)}
                className={`min-h-[58px] sm:min-h-[82px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-colors border-0 relative ${
                  !cell.isCurrentMonth
                    ? 'bg-[#FAFAFC] dark:bg-[#18181A] opacity-35 cursor-default'
                    : isSelected
                    ? 'bg-[var(--theme-tint)]/60 dark:bg-[var(--theme-tint-dark)]/40'
                    : 'hover:bg-[#F0F2F5]/50 dark:hover:bg-[#2C2C2E]/40'
                }`}
              >
                {/* Day Number Row */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                      cell.isToday
                        ? 'bg-[var(--theme-primary)] text-white font-bold shadow-apple-xs'
                        : isSelected
                        ? 'text-[var(--theme-primary)] font-bold'
                        : 'text-[#050505] dark:text-[#E4E6EB]'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {/* Mobile Indicator Dot (if event exists) */}
                  {hasEvents && (
                    <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]" />
                  )}
                </div>

                {/* Desktop Event Pill Inside Cell */}
                {hasEvents && (
                  <div className="hidden sm:flex flex-col gap-1 w-full mt-1">
                    {cell.events.map((ev) => {
                      const Icon = ICON_MAP[ev.iconName] || Calendar03Icon;
                      return (
                        <div
                          key={ev.id}
                          className="w-full truncate px-1.5 py-0.5 rounded-md bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] text-[10px] font-bold flex items-center gap-1 border border-[var(--theme-primary)]/20"
                          title={`${ev.name} • ${ev.discountLevel}`}
                        >
                          <HugeiconsIcon icon={Icon} size={11} className="shrink-0" />
                          <span className="truncate">{ev.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Details Section (Shows Events in Current Month or on Selected Day) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5 text-xs font-semibold">
          <span className="text-[#050505] dark:text-[#E4E6EB]">
            {selectedDay
              ? `Events on ${MONTH_NAMES[currentMonth]} ${selectedDay}, ${currentYear}`
              : `Events in ${MONTH_NAMES[currentMonth]} ${currentYear}`}
          </span>
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-[var(--theme-primary)] hover:underline border-0 bg-transparent"
            >
              Show all month events
            </button>
          )}
        </div>

        {/* Selected Day or Month Events List */}
        {(selectedDay ? selectedDayEvents : monthEvents).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(selectedDay ? selectedDayEvents : monthEvents).map((ev) => {
              const Icon = ICON_MAP[ev.iconName] || Calendar03Icon;
              return (
                <div
                  key={ev.id}
                  className="bg-white dark:bg-[#1C1C1E] p-3.5 rounded-2xl border border-[#E4E6EB] dark:border-[#38383A] shadow-apple-xs flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-2">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={Icon} size={16} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#050505] dark:text-[#E4E6EB] leading-tight truncate">
                            {ev.name}
                          </h3>
                          <span className="text-[11px] text-[#65676B] dark:text-[#8E8E93] block">
                            {MONTH_NAMES[ev.month]} {ev.day}, {ev.year}
                          </span>
                        </div>
                      </div>

                      {/* Discount Pill */}
                      <span className="text-[11px] font-bold text-[#34C759] dark:text-[#30D158] bg-[#34C759]/10 px-2 py-0.5 rounded-md shrink-0">
                        {ev.discountLevel}
                      </span>
                    </div>

                    {/* Best Category Chips */}
                    {ev.bestFor && ev.bestFor.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1 pt-0.5">
                        {ev.bestFor.map((cat) => (
                          <span
                            key={cat}
                            className="text-[10px] font-medium text-[#65676B] dark:text-[#8E8E93] bg-[#F0F2F5] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded-md"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shipping Alert */}
                  {ev.shippingAlert && (
                    <div className="flex items-start gap-1.5 p-2 rounded-xl bg-[#FFF9E6] dark:bg-[#2A2415] text-[11px] text-[#92400E] dark:text-[#FDE68A] leading-snug">
                      <HugeiconsIcon
                        icon={DeliveryTruck01Icon}
                        size={14}
                        className="text-[#D97706] dark:text-[#FBBF24] shrink-0 mt-0.5"
                      />
                      <span>{ev.shippingAlert}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Month / Day Notice */
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E4E6EB] dark:border-[#38383A] text-center space-y-1.5 text-xs text-[#65676B] dark:text-[#8E8E93]">
            <p>
              {selectedDay
                ? `No sales events on ${MONTH_NAMES[currentMonth]} ${selectedDay}, ${currentYear}.`
                : `No major retail sales events in ${MONTH_NAMES[currentMonth]} ${currentYear}.`}
            </p>
            {nextUpcoming && (
              <p className="font-medium text-[var(--theme-primary)]">
                Next upcoming: {nextUpcoming.name} on {MONTH_NAMES[nextUpcoming.month]} {nextUpcoming.day}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
