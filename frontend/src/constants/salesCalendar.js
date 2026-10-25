/**
 * Key Sales Dates and Holidays Calendar Data for WhatGift
 * Clean, calendar-focused dataset with realistic sales estimates and shipping cutoffs.
 */

// Helper to calculate the Nth weekday of a month (e.g. 4th Friday)
function getNthWeekdayOfMonth(year, month, weekday, n) {
  const firstDay = new Date(year, month, 1);
  let dayOfWeek = firstDay.getDay();
  let dayOffset = (weekday - dayOfWeek + 7) % 7;
  let day = 1 + dayOffset + (n - 1) * 7;
  return new Date(year, month, day);
}

// Computus algorithm to calculate Easter Sunday
function getEasterSunday(year) {
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
}

export const SALES_AND_HOLIDAYS = [
  {
    id: 'valentines-day',
    name: 'Valentine’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Romantic & Personal',
    discountLevel: '10% – 20% Off',
    getDates: (year) => [new Date(year, 1, 14)], // Feb 14
    bestFor: ['Jewelry', 'Fragrances', 'Keepsakes'],
    shippingAlert: 'Order custom or engraved items by Feb 5 for guaranteed delivery.'
  },
  {
    id: 'easter-sales',
    name: 'Easter Sunday',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Spring Holiday',
    discountLevel: '10% – 15% Off',
    getDates: (year) => [getEasterSunday(year)],
    bestFor: ['Toys & Crafts', 'Board Games', 'Spring Clothing'],
    shippingAlert: 'Deliveries pause on Good Friday and Easter Monday.'
  },
  {
    id: 'mothers-day',
    name: 'Mother’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Family Appreciation',
    discountLevel: '10% – 20% Off',
    getDates: (year) => [getNthWeekdayOfMonth(year, 4, 0, 2)], // 2nd Sunday in May
    bestFor: ['Skincare', 'Cookware', 'Photo Gifts'],
    shippingAlert: 'Custom photo books and prints need 5–7 days processing.'
  },
  {
    id: 'fathers-day',
    name: 'Father’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Tools & Outdoors',
    discountLevel: '10% – 20% Off',
    getDates: (year) => [getNthWeekdayOfMonth(year, 5, 0, 3)], // 3rd Sunday in June
    bestFor: ['Tools', 'Outdoor Gear', 'Smartwatches'],
    shippingAlert: 'Bulky equipment or toolsets may take extra freight transit time.'
  },
  {
    id: 'eofy-mid-year',
    name: 'EOFY & Mid-Year Sales',
    category: 'clearance',
    iconName: 'Tag01Icon',
    badge: 'Mid-Year Clearance',
    discountLevel: '15% – 30% Off',
    getDates: (year) => [new Date(year, 5, 30)], // June 30
    bestFor: ['Laptops', 'Office Gear', 'Appliances'],
    shippingAlert: 'Standard mid-year shipping times with normal carrier operations.'
  },
  {
    id: 'prime-day-summer',
    name: 'Prime Day (Summer)',
    category: 'major-deals',
    iconName: 'ShoppingBag01Icon',
    badge: 'Mid-Year Black Friday',
    discountLevel: '15% – 25% Off',
    getDates: (year) => [new Date(year, 6, 15)], // July 15
    bestFor: ['Smart Home', 'Audio', 'Kitchenware'],
    shippingAlert: 'Fast 1–2 day shipping for eligible in-stock items.'
  },
  {
    id: 'back-to-school',
    name: 'Back to School Deals',
    category: 'seasonal',
    iconName: 'ShoppingBag01Icon',
    badge: 'Student Essentials',
    discountLevel: '10% – 20% Off',
    getDates: (year) => [new Date(year, 7, 10)], // August 10
    bestFor: ['Backpacks', 'Stationery', 'Student Tablets'],
    shippingAlert: 'Order early in August to avoid peak backorder delays.'
  },
  {
    id: 'prime-big-deal-days',
    name: 'Prime Big Deal Days',
    category: 'major-deals',
    iconName: 'ShoppingBag01Icon',
    badge: 'Early Holiday Sale',
    discountLevel: '10% – 20% Off',
    getDates: (year) => [new Date(year, 9, 8)], // October 8
    bestFor: ['Holiday Toys', 'Headphones', 'Tablets'],
    shippingAlert: 'Plentiful shipping buffer for holiday gift arrivals.'
  },
  {
    id: 'halloween',
    name: 'Halloween',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Costumes & Fall',
    discountLevel: '10% – 20% Off',
    getDates: (year) => [new Date(year, 9, 31)], // October 31
    bestFor: ['Costumes', 'Fall Decor', 'Party Games'],
    shippingAlert: 'Order costumes before mid-October to avoid express courier fees.'
  },
  {
    id: 'singles-day',
    name: 'Singles’ Day (11.11)',
    category: 'major-deals',
    iconName: 'Tag01Icon',
    badge: 'Global Retail Sale',
    discountLevel: '10% – 25% Off',
    getDates: (year) => [new Date(year, 10, 11)], // Nov 11
    bestFor: ['Electronics', 'Accessories', 'Beauty'],
    shippingAlert: 'International packages need 3–4 weeks for holiday arrival.'
  },
  {
    id: 'black-friday',
    name: 'Black Friday',
    category: 'major-deals',
    iconName: 'FireIcon',
    badge: 'Peak Tech & Gift Sales',
    discountLevel: '15% – 30% Off',
    getDates: (year) => [getNthWeekdayOfMonth(year, 10, 5, 4)], // 4th Friday in Nov
    bestFor: ['Tech & Gaming', 'Appliances', 'Toys'],
    shippingAlert: 'Safe for Christmas delivery with standard domestic shipping.'
  },
  {
    id: 'cyber-monday',
    name: 'Cyber Monday',
    category: 'major-deals',
    iconName: 'SparklesIcon',
    badge: 'Online Exclusives',
    discountLevel: '15% – 25% Off',
    getDates: (year) => {
      const bf = getNthWeekdayOfMonth(year, 10, 5, 4);
      const cm = new Date(bf);
      cm.setDate(bf.getDate() + 3);
      return [cm];
    },
    bestFor: ['Laptops', 'Gadgets', 'Apparel'],
    shippingAlert: 'Order early in the day; carrier queues surge this week.'
  },
  {
    id: 'christmas-eve-day',
    name: 'Christmas Eve & Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Peak Holiday Gifting',
    discountLevel: '10% – 15% Off',
    getDates: (year) => [new Date(year, 11, 24), new Date(year, 11, 25)], // Dec 24 & 25
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
    getDates: (year) => [new Date(year, 11, 26)], // Dec 26
    bestFor: ['Seasonal Stock', 'Apparel', 'Gift Sets'],
    shippingAlert: 'Standard postal transit speeds return to normal.'
  }
];

/**
 * Returns all events with their computed dates for a given year.
 */
export function getEventsForYear(year) {
  const result = [];
  SALES_AND_HOLIDAYS.forEach(event => {
    const dates = event.getDates(year);
    dates.forEach(date => {
      result.push({
        ...event,
        date,
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
      });
    });
  });
  return result;
}

/**
 * Returns all events occurring in a specific year and month (0-11).
 */
export function getEventsForMonth(year, month) {
  const yearEvents = getEventsForYear(year);
  return yearEvents
    .filter(e => e.month === month)
    .sort((a, b) => a.day - b.day);
}

/**
 * Returns all events occurring on a specific year, month (0-11), and day (1-31).
 */
export function getEventsForDay(year, month, day) {
  const monthEvents = getEventsForMonth(year, month);
  return monthEvents.filter(e => e.day === day);
}

/**
 * Returns the next upcoming event from a reference date.
 */
export function getNextUpcomingEvent(referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  let events = [
    ...getEventsForYear(currentYear),
    ...getEventsForYear(currentYear + 1)
  ];
  
  const startOfToday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  
  const futureEvents = events
    .filter(e => e.date >= startOfToday)
    .sort((a, b) => a.date - b.date);
    
  return futureEvents.length > 0 ? futureEvents[0] : null;
}
