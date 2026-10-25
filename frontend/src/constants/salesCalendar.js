/**
 * Key Sales Dates and Holidays Calendar Data for WhatGift
 * Provides curated dates, buying tips, discount levels, and shipping deadlines.
 */

// Helper to calculate the Nth weekday of a month (e.g. 4th Thursday or Friday)
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
    badge: 'Biggest Tech & Gift Sales',
    discountLevel: '30% – 70% Off',
    dateLabel: 'Late November (4th Friday)',
    getDate: (year) => getNthWeekdayOfMonth(year, 10, 5, 4), // Month 10 = Nov, weekday 5 = Friday
    bestFor: ['Electronics & Gaming', 'Smart Home & Audio', 'Kitchen Appliances', 'Toys & Board Games', 'Winter Coats'],
    proTips: [
      'Early "Black Friday Week" deals start the Monday prior — track wishlist prices starting mid-November.',
      'Major retailers (Amazon, Best Buy, Target) match prices; use browser price trackers to verify historic lows.',
      'Most retailers extend return windows through January 31st for items bought during Black Friday.'
    ],
    shippingAlert: 'Safe for Christmas delivery with standard domestic shipping.',
    highlights: 'Historically the single best day to purchase big-ticket electronics, consoles, and television gifts.'
  },
  {
    id: 'cyber-monday',
    name: 'Cyber Monday',
    category: 'major-deals',
    iconName: 'SparklesIcon',
    badge: 'Online Exclusives',
    discountLevel: '40% – 75% Off',
    dateLabel: 'Late November / Early December',
    getDate: (year) => {
      const bf = getNthWeekdayOfMonth(year, 10, 5, 4);
      const cm = new Date(bf);
      cm.setDate(bf.getDate() + 3);
      return cm;
    },
    bestFor: ['Laptops & Computer Accessories', 'Software & Digital Subscriptions', 'Apparel & Footwear', 'Smart Gadgets'],
    proTips: [
      'Look for stackable sitewide coupon codes and limited-quantity lightning deals.',
      'Clothing and fashion brands often offer their deepest discounts of the year on this day rather than Black Friday.'
    ],
    shippingAlert: 'Order early in the day; warehouse dispatch queues surge significantly this week.',
    highlights: 'The biggest online shopping day of the year for direct-to-consumer and fashion brands.'
  },
  {
    id: 'singles-day',
    name: 'Singles’ Day (11.11)',
    category: 'major-deals',
    iconName: 'Tag01Icon',
    badge: 'Global Mega Sale',
    discountLevel: '30% – 80% Off',
    dateLabel: 'November 11',
    getDate: (year) => new Date(year, 10, 11),
    bestFor: ['Consumer Electronics', 'Beauty & Skincare', 'Gadgets & Accessories', 'Imported Gifts'],
    proTips: [
      'The largest 24-hour retail festival worldwide. Check global storefronts (AliExpress, Amazon Global, ASOS).',
      'If ordering from overseas storefronts, order now to beat the international December customs rush.'
    ],
    shippingAlert: 'International packages shipped around 11.11 need 3–4 weeks for holiday arrival.',
    highlights: 'Massive global shopping day with exceptional value on electronics and novelty accessories.'
  },
  {
    id: 'christmas-season',
    name: 'Christmas Eve & Christmas Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Peak Holiday Gifting',
    discountLevel: 'Holiday Bundles',
    dateLabel: 'December 24 – 25',
    getDate: (year) => new Date(year, 11, 25),
    bestFor: ['Family Gift Exchanges', 'Stocking Stuffers', 'Special Surprise Gifts', 'Holiday Sweets'],
    proTips: [
      'Avoid last-minute panic buying by claiming items on family wishlists by early December.',
      'Check local retail store pickup options (Click & Collect) if online shipping cutoffs have passed.'
    ],
    shippingAlert: 'Critical Cutoff: Standard shipping cutoff is Dec 15–18; Express is Dec 21–22 in most regions.',
    highlights: 'The heart of family gift giving! Coordinated secretly in WhatGift so no surprises are spoiled.'
  },
  {
    id: 'boxing-day',
    name: 'Boxing Day & New Year Clearance',
    category: 'clearance',
    iconName: 'Tag01Icon',
    badge: 'Massive Inventory Clearance',
    discountLevel: '50% – 80% Off',
    dateLabel: 'December 26 – January 2',
    getDate: (year) => new Date(year, 11, 26),
    bestFor: ['Holiday Decor & Trees', 'Leftover Tech Stock', 'Winter Apparel', 'Premium Gift Sets', 'Fragrances'],
    proTips: [
      'Retailers urgently slash prices to clear seasonal stock before inventory counts.',
      'Golden opportunity to buy luxury gift baskets, perfumes, and premium sets for upcoming early-year birthdays at half price.'
    ],
    shippingAlert: 'Standard shipping speeds return to normal following the post-Christmas rush.',
    highlights: 'The deepest percentage markdowns of the entire year on seasonal collections.'
  },
  {
    id: 'prime-day-summer',
    name: 'Amazon Prime Day (Summer)',
    category: 'major-deals',
    iconName: 'ShoppingBag01Icon',
    badge: 'Mid-Year Black Friday',
    discountLevel: '30% – 60% Off',
    dateLabel: 'Mid-July (Approx. July 14–16)',
    getDate: (year) => new Date(year, 6, 15), // July 15 approx
    bestFor: ['Amazon Hardware (Kindle, Echo, Fire)', 'Headphones & Speakers', 'Kitchen Gadgets (Air Fryers, Blenders)', 'Toys'],
    proTips: [
      'Competitor stores like Target, Walmart, and Best Buy run identical "anti-Prime" flash sales with no membership required.',
      'Prime Day is the premier time to purchase Kindle e-readers and smart home assistants as gifts.'
    ],
    shippingAlert: 'Fast 1–2 day Prime shipping on in-stock items.',
    highlights: 'Tremendous summer opportunity to cross off wishlist gifts months ahead of the year-end rush.'
  },
  {
    id: 'prime-big-deal-days',
    name: 'Prime Big Deal Days (Fall)',
    category: 'major-deals',
    iconName: 'ShoppingBag01Icon',
    badge: 'Early Holiday Kickoff',
    discountLevel: '25% – 55% Off',
    dateLabel: 'Early–Mid October',
    getDate: (year) => new Date(year, 9, 8), // October 8 approx
    bestFor: ['Holiday Toys', 'Consumer Electronics', 'Audio Gear', 'Early Stocking Stuffers'],
    proTips: [
      'Acts as the official early holiday sale kickoff. Popular toys often sell out and do not restock for Black Friday.',
      'Lock in top items early to eliminate December shipping stress completely.'
    ],
    shippingAlert: 'Plentiful shipping buffer for holiday gift arrivals.',
    highlights: 'Smart gift buyers buy trending children’s toys here before year-end stock shortages.'
  },
  {
    id: 'eofy-mid-year',
    name: 'Mid-Year & EOFY Clearance',
    category: 'clearance',
    iconName: 'Tag01Icon',
    badge: 'Tax Year & Stocktake Sales',
    discountLevel: '30% – 70% Off',
    dateLabel: 'June 1 – June 30',
    getDate: (year) => new Date(year, 5, 25), // Late June
    bestFor: ['Computers & Tablets', 'Office Furniture & Chairs', 'Home Appliances', 'Winter & Mid-Season Fashion'],
    proTips: [
      'Department stores and tech outlets clear old model lines to refresh catalogs for the second half of the year.',
      'Great for buying electronics and workspace essentials on wishlist registries.'
    ],
    shippingAlert: 'Fast mid-year logistics with minimal delivery delays.',
    highlights: 'Extensive tax-time and stocktake promotions across major retail categories.'
  },
  {
    id: 'valentines-day',
    name: 'Valentine’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Romantic & Personal Gifts',
    discountLevel: '15% – 40% Off Select Bundles',
    dateLabel: 'February 14',
    getDate: (year) => new Date(year, 1, 14),
    bestFor: ['Jewelry & Watches', 'Perfume & Fragrances', 'Gourmet Chocolates', 'Personalized Keepsakes', 'Silk & Sleepwear'],
    proTips: [
      'Order custom engraved or bespoke items at least 2–3 weeks early (by late January).',
      'Avoid last-minute florist and confectionery price surcharges by reserving in advance.'
    ],
    shippingAlert: 'Order by February 7 for guaranteed standard delivery.',
    highlights: 'High-emotion gifting day with abundant promotional bundle packages on luxury accessories.'
  },
  {
    id: 'mothers-day',
    name: 'Mother’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Appreciation & Pampering',
    discountLevel: '20% – 45% Off',
    dateLabel: 'Second Sunday of May',
    getDate: (year) => getNthWeekdayOfMonth(year, 4, 0, 2), // Month 4 = May, 0 = Sunday, 2nd Sunday
    bestFor: ['Spa & Skincare Gift Baskets', 'Kitchenware & Cookware', 'Photo Books & Frames', 'Jewelry', 'Gardening & Planters'],
    proTips: [
      'Look for free gift-with-purchase beauty deals at department stores starting 3 weeks prior.',
      'Photo printing services offer deep 40–50% promo codes around mid-April.'
    ],
    shippingAlert: 'Custom photo books and framed prints need 7–10 days production time.',
    highlights: 'Cherished family holiday celebrating mothers, grandmothers, and maternal figures.'
  },
  {
    id: 'fathers-day',
    name: 'Father’s Day',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Tools, Tech & Outdoors',
    discountLevel: '20% – 50% Off',
    dateLabel: 'Third Sunday of June (US/UK) / First Sunday of Sep (AU)',
    getDate: (year) => getNthWeekdayOfMonth(year, 5, 0, 3), // Month 5 = June, 3rd Sunday
    bestFor: ['Power Tools & Workshop', 'Barbecue & Grilling', 'Smartwatches & Golf GPS', 'Craft Beer & Spirits', 'Grooming'],
    proTips: [
      'Hardware superstores and sporting goods retailers offer their most competitive tool bundle discounts.',
      'Outdoor cooking and grilling kits frequently have promotional rebates.'
    ],
    shippingAlert: 'Heavy toolsets or outdoor equipment can have longer freight transit times.',
    highlights: 'Excellent retail sales on power tools, outdoor leisure, and men’s accessories.'
  },
  {
    id: 'easter-sales',
    name: 'Easter & Spring Sales',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Spring & Family Activities',
    discountLevel: '15% – 35% Off',
    dateLabel: 'Late March / Mid-April',
    getDate: (year) => {
      // Computus calculation for Easter Sunday
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
    bestFor: ['Children’s Toys & Crafts', 'Spring Apparel', 'Confectionery', 'Board Games & Outdoor Toys'],
    proTips: [
      'Toy stores run spring sales competing with Easter basket shopping.',
      'Immediately on Easter Monday, premium seasonal chocolates drop 50%–70% off.'
    ],
    shippingAlert: 'Postal carriers often pause deliveries on Good Friday and Easter Monday.',
    highlights: 'Joyous family celebration with great discounts on children’s toys and outdoor games.'
  },
  {
    id: 'back-to-school',
    name: 'Back to School Sales',
    category: 'seasonal',
    iconName: 'ShoppingBag01Icon',
    badge: 'Student Tech & Essentials',
    discountLevel: '15% – 45% Off + Tax-Free Days',
    dateLabel: 'July – August & January – February',
    getDate: (year) => new Date(year, 7, 10), // August 10 approx
    bestFor: ['Backpacks & Bags', 'Stationery & Art Supplies', 'Tablets & Student Laptops', 'Desk Accessories & Monitors'],
    proTips: [
      'Apple offers annual higher education promotions (free gift card or headphones with Mac/iPad purchase).',
      'Check if your state or region holds a tax-free shopping weekend during early August.'
    ],
    shippingAlert: 'High demand on backpacks and calculators can lead to late-August backorders.',
    highlights: 'Top time of year for student technology gifts, backpacks, and organizational stationery.'
  },
  {
    id: 'halloween',
    name: 'Halloween & Fall Festivities',
    category: 'holidays',
    iconName: 'GiftIcon',
    badge: 'Costumes, Cozy & Novelty',
    discountLevel: '20% – 50% Off',
    dateLabel: 'October 31',
    getDate: (year) => new Date(year, 9, 31),
    bestFor: ['Costumes & Accessories', 'Fall Fragrances & Candles', 'Party Games', 'Novelty Sweets & Decor'],
    proTips: [
      'Buy costumes before mid-October to ensure size availability and avoid express shipping costs.',
      'November 1st is the premier clearance day for candy and fall decor.'
    ],
    shippingAlert: 'Costume deliveries peak in late October; order early to avoid stockouts.',
    highlights: 'Fun holiday kickstarting the festive autumn and winter gift-giving season.'
  }
];

/**
 * Calculates next date occurrence for an event relative to a given reference date.
 */
export function getNextEventDate(event, referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  let candidate = event.getDate(currentYear);

  // Set candidate time to end of day to include events happening today
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
  if (daysRemaining === 0) return { text: 'Happening Today!', urgent: true, highlight: 'emerald' };
  if (daysRemaining === 1) return { text: 'Tomorrow!', urgent: true, highlight: 'amber' };
  if (daysRemaining <= 7) return { text: `In ${daysRemaining} days (This week)`, urgent: true, highlight: 'amber' };
  if (daysRemaining <= 30) return { text: `In ${daysRemaining} days`, urgent: false, highlight: 'blue' };

  const months = Math.round(daysRemaining / 30);
  if (months <= 1) return { text: `In ~${daysRemaining} days`, urgent: false, highlight: 'neutral' };
  return { text: `In ~${months} months`, urgent: false, highlight: 'neutral' };
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
