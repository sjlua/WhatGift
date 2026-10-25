/**
 * Key Sales Dates and Holidays Calendar Data for WhatGift
 * Clean, minimal dataset with realistic sales estimates and shipping cutoffs.
 */

// Helper to calculate the Nth weekday of a month (e.g. 4th Friday)
function getNthWeekdayOfMonth(year, month, weekday, n) {
  const firstDay = new Date(year, month, 1);
  let dayOfWeek = firstDay.getDay();
  let dayOffset = (weekday - dayOfWeek + 7) % 7;
  let day = 1 + dayOffset + (n - 1) * 7;
  return new Date(year, month, day);
}

// Helper to calculate the last weekday of a month (e.g. last Monday in May)
function getLastWeekdayOfMonth(year, month, weekday) {
  const lastDay = new Date(year, month + 1, 0);
  let dayOfWeek = lastDay.getDay();
  let dayOffset = (dayOfWeek - weekday + 7) % 7;
  return new Date(year, month, lastDay.getDate() - dayOffset);
}

export const SALES_AND_HOLIDAYS = [
  {
    id: 'black-friday',
    name: 'Black Friday',
    category: 'major-deals',
    iconName: 'FireIcon',
    badge: 'Tech & Gifts',
    discountLevel: '15% – 30% Off',
    dateLabel: 'Late November',
    getDate: (year) => getNthWeekdayOfMonth(year, 10, 5, 4), // 4th Friday in Nov
    bestFor: ['Tech & Gaming', 'Appliances', 'Toys'],
    shippingAlert: 'Safe for Christmas delivery with standard domestic shipping.'
  },
  {
    id: 'cyber-monday',
    name: 'Cyber Monday',
    category: 'major-deals',
    iconName: 'SparklesIcon',
    badge: 'Online Sales',
    discountLevel: '15% – 25% Off',
    dateLabel: 'Late Nov / Early Dec',
    getDate: (year) => {
      const bf = getNthWeekdayOfMonth(year, 10, 5, 4);
      const cm = new Date(bf);
      cm.setDate(bf.getDate() + 3);
      return cm;
    },
    bestFor: ['Laptops', 'Gadgets', 'Apparel'],
    shippingAlert: 'Order early in the day; dispatch queues surge this week.'
  },
  {
    id: 'singles-day',
    name: 'Singles’ Day (11.11)',
    category: 'major-deals',
    iconName: 'Tag01Icon',
    badge: 'Global Sale',
    discountLevel: '10% – 20% Off',
    dateLabel: 'November 11',
    getDate: (year) => new Date(year, 10, 11),
    bestFor: ['Electronics', 'Beauty', 'Accessories'],
    shippingAlert: 'International packages shipped around 11.11 need 3–4 weeks for holiday arrival.'
  },
  {
    id: 'christmas-season',
    name: 'Christmas Eve & Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Holiday Gifting',
    discountLevel: '10% – 15% Off',
    dateLabel: 'December 24 – 25',
    getDate: (year) => new Date(year, 11, 25),
    bestFor: ['Wishlist Gifts', 'Stocking Stuffers'],
    shippingAlert: 'Cutoff: Order standard shipping by Dec 16; Express by Dec 21.'
  },
  {
    id: 'boxing-day',
    name: 'Boxing Day Clearance',
    category: 'clearance',
    iconName: 'Tag01Icon',
    badge: 'Post-Holiday Clearance',
    discountLevel: '20% – 40% Off',
    dateLabel: 'December 26 – Jan 2',
    getDate: (year) => new Date(year, 11, 26),
    bestFor: ['Seasonal Stock', 'Apparel', 'Gift Sets'],
    shippingAlert: 'Standard postal transit speeds return to normal.'
  },
  {
    id: 'prime-day-summer',
    name: 'Prime Day (Summer)',
    category: 'major-deals',
    iconName: 'ShoppingBag01Icon',
    badge: 'Mid-Year Deals',
    discountLevel: '15% – 25% Off',
    dateLabel: 'Mid-July',
    getDate: (year) => new Date(year, 6, 15),
    bestFor: ['Audio', 'Smart Home', 'Kitchenware'],
    shippingAlert: 'Fast 1–2 day shipping on eligible in-stock items.'
  },
  {
    id: 'prime-big-deal-days',
    name: 'Prime Big Deal Days (Fall)',
    category: 'major-deals',
    iconName: 'ShoppingBag01Icon',
    badge: 'Early Holiday Sale',
    discountLevel: '10% – 20% Off',
    dateLabel: 'Early October',
    getDate: (year) => new Date(year, 9, 8),
    bestFor: ['Holiday Toys', 'Headphones', 'Tablets'],
    shippingAlert: 'Plentiful shipping buffer for holiday gift arrivals.'
  },
  {
    id: 'eofy-mid-year',
    name: 'Mid-Year & EOFY Sales',
    category: 'clearance',
    iconName: 'Tag01Icon',
    badge: 'Mid-Year Clearance',
    discountLevel: '15% – 30% Off',
    dateLabel: 'June',
    getDate: (year) => new Date(year, 5, 25),
    bestFor: ['Computers', 'Office Tech', 'Appliances'],
    shippingAlert: 'Fast mid-year logistics with minimal delivery delays.'
  },
  {
    id: 'valentines-day',
    name: 'Valentine’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Gifts & Keepsakes',
    discountLevel: '10% – 20% Off',
    dateLabel: 'February 14',
    getDate: (year) => new Date(year, 1, 14),
    bestFor: ['Jewelry', 'Fragrances', 'Personalized Gifts'],
    shippingAlert: 'Order custom or engraved items by Feb 5 for guaranteed delivery.'
  },
  {
    id: 'mothers-day',
    name: 'Mother’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Family Appreciation',
    discountLevel: '10% – 20% Off',
    dateLabel: 'Second Sunday of May',
    getDate: (year) => getNthWeekdayOfMonth(year, 4, 0, 2),
    bestFor: ['Skincare', 'Cookware', 'Keepsakes'],
    shippingAlert: 'Custom photo gifts and prints need 5–7 days processing time.'
  },
  {
    id: 'fathers-day',
    name: 'Father’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Tools & Outdoors',
    discountLevel: '10% – 20% Off',
    dateLabel: 'Third Sunday of June (US/UK) / Sep (AU)',
    getDate: (year) => getNthWeekdayOfMonth(year, 5, 0, 3),
    bestFor: ['Tools', 'Outdoor Gear', 'Smartwatches'],
    shippingAlert: 'Bulky equipment or tool sets may require freight shipping time.'
  },
  {
    id: 'easter-sales',
    name: 'Easter & Spring Deals',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Spring Activities',
    discountLevel: '10% – 15% Off',
    dateLabel: 'March / April',
    getDate: (year) => {
      const a = year % 19;
      const b = Math.floor(year / 100);
      const c = year % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
      const day = ((h + l - 7 * m + 114) % 31) + 1;
      return new Date(year, month, day);
    },
    bestFor: ['Kids Toys', 'Board Games', 'Spring Clothing'],
    shippingAlert: 'Postal carriers often pause deliveries on Good Friday and Easter Monday.'
  },
  {
    id: 'back-to-school',
    name: 'Back to School',
    category: 'seasonal',
    iconName: 'ShoppingBag01Icon',
    badge: 'Student Essentials',
    discountLevel: '10% – 20% Off',
    dateLabel: 'August & January',
    getDate: (year) => new Date(year, 7, 10),
    bestFor: ['Backpacks', 'Stationery', 'Student Laptops'],
    shippingAlert: 'High demand in late August can lead to temporary backorders.'
  },
  {
    id: 'labor-day',
    name: 'Labor Day Sales',
    category: 'seasonal',
    iconName: 'Tag01Icon',
    badge: 'Late Summer Deals',
    discountLevel: '15% – 25% Off',
    dateLabel: 'First Monday of September',
    getDate: (year) => getNthWeekdayOfMonth(year, 8, 1, 1),
    bestFor: ['Mattresses', 'Home Goods', 'Summer Clearance'],
    shippingAlert: 'Courier holiday pause on Labor Day Monday.'
  },
  {
    id: 'memorial-day',
    name: 'Memorial Day Deals',
    category: 'seasonal',
    iconName: 'Tag01Icon',
    badge: 'Early Summer Sales',
    discountLevel: '10% – 20% Off',
    dateLabel: 'Last Monday of May',
    getDate: (year) => getLastWeekdayOfMonth(year, 4, 1),
    bestFor: ['Outdoor Gear', 'Apparel', 'Home Improvement'],
    shippingAlert: 'Courier delay over the long holiday weekend.'
  },
  {
    id: 'halloween',
    name: 'Halloween & Fall',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Fall Festivities',
    discountLevel: '10% – 20% Off',
    dateLabel: 'October 31',
    getDate: (year) => new Date(year, 9, 31),
    bestFor: ['Costumes', 'Fall Decor', 'Party Games'],
    shippingAlert: 'Order costumes by mid-October to avoid shipping rush.'
  }
];

/**
 * Calculates next date occurrence for an event relative to a given reference date.
 */
export function getNextEventDate(event, referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  let candidate = event.getDate(currentYear);
  candidate.setHours(23, 59, 59, 999);
  
  if (candidate < referenceDate) {
    candidate = event.getDate(currentYear + 1);
    candidate.setHours(23, 59, 59, 999);
  }
  
  return candidate;
}

/**
 * Calculates days remaining until the event.
 */
export function getDaysRemaining(targetDate, referenceDate = new Date()) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startOfDayRef = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const startOfDayTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  return Math.round((startOfDayTarget - startOfDayRef) / msPerDay);
}

/**
 * Formats countdown nicely: "Today", "Tomorrow", "In 12 days", "In 2 months", etc.
 */
export function formatProximityBadge(daysRemaining) {
  if (daysRemaining === 0) return { text: 'Today', urgent: true };
  if (daysRemaining === 1) return { text: 'Tomorrow', urgent: true };
  if (daysRemaining <= 7) return { text: `In ${daysRemaining}d`, urgent: true };
  if (daysRemaining <= 30) return { text: `In ${daysRemaining}d`, urgent: false };
  
  const months = Math.round(daysRemaining / 30);
  if (months <= 1) return { text: `In ~${daysRemaining}d`, urgent: false };
  return { text: `In ~${months}mo`, urgent: false };
}

/**
 * Get events with computed next dates and days remaining, sorted chronologically by next occurrence.
 */
export function getChronologicalEvents(referenceDate = new Date()) {
  return SALES_AND_HOLIDAYS.map(event => {
    const nextDate = getNextEventDate(event, referenceDate);
    const daysRemaining = getDaysRemaining(nextDate, referenceDate);
    const badgeInfo = formatProximityBadge(daysRemaining);
    return {
      ...event,
      computedNextDate: nextDate,
      daysRemaining,
      badgeInfo
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);
}
