import {
  SparklesIcon,
  GiftIcon,
  Shield01Icon,
  PaintBoardIcon,
  Tick02Icon,
  Delete02Icon,
  UserGroupIcon,
  Sun01Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';

export const CHANGELOG_RELEASES = [
  {
    version: 'v0.4.0',
    title: 'Festive Holiday Atmosphere, Dual Climates & macOS Two-Pane Settings',
    tag: 'Latest',
    tagColor: 'bg-[var(--theme-primary)] text-white',
    highlights: [
      {
        icon: SparklesIcon,
        title: 'Atmospheric Holiday Climates (Winter Snow & Aussie Summer)',
        description:
          'Experience gentle ambient falling snowflakes or Australian warm summer holiday sparkles across your wishlist canvas, with auto-detection for Southern Hemisphere locales and toggle controls in Customisation.',
      },
      {
        icon: GiftIcon,
        title: 'Christmas Days Countdown & Tinted Header',
        description:
          'Added a clean holiday countdown badge to both desktop and mobile headers showing the exact days until Christmas, paired with flat theme-tinted headers and status bar alignment.',
      },
      {
        icon: Settings02Icon,
        title: 'macOS System Settings Split-Pane Layout',
        description:
          'Rebuilt Settings and Family Management into a native macOS System Settings two-pane architecture with unified Circle Settings & Invites, consolidated Customisation (themes, dark mode, scaling, and haptics), and embedded release notes.',
      },
      {
        icon: Shield01Icon,
        title: 'Family Wishlist Item Deletion Governance',
        description:
          'Introduced an admin-controlled toggle allowing families to turn wishlist item deletion on or off across all member wishlists, with in-app deletion confirmations.',
      },
      {
        icon: PaintBoardIcon,
        title: 'Edge-to-Edge Sharp Sidebar Navigation',
        description:
          'Removed awkward rounded pill gaps and external padding from desktop and mobile sidebars in favor of flush, edge-to-edge buttons with crisp 4px accent indicator bars.',
      },
      {
        icon: UserGroupIcon,
        title: 'Season-Aware Curated Avatars',
        description:
          'Profile and member avatar selectors now dynamically surface theme-relevant characters (summer beach gear, holiday ornaments, and festive icons) at the top of the picker.',
      },
    ],
  },
  {
    version: 'v0.3.0',
    title: 'Permanent Wish Safeguards, Resilient Imagery & Mobile Ergonomics',
    tag: 'Previous',
    tagColor: 'bg-[#8E8E93]/20 text-[#636366] dark:text-[#E5E5EA]',
    highlights: [
      {
        icon: Shield01Icon,
        title: 'Permanent Item Safeguards & Anti-Spoiler Protection',
        description:
          'Introduced an in-app confirmation safeguard informing users that new wishlist items are permanent and cannot be deleted once added (protecting surprise gift claims), while allowing flexible editing of prices, notes, and store links anytime.',
      },
      {
        icon: SparklesIcon,
        title: 'Resilient Cross-Origin Image Preview Proxy',
        description:
          'Integrated automatic Cloudflare-backed proxy fallback for retailer images with strict hotlink protection or AWS WAF bot challenges (such as Spotlight Stores), ensuring product photos render reliably in previews, wishlist cards, and lightboxes.',
      },
      {
        icon: PaintBoardIcon,
        title: 'Refined Mobile Sidebar & Decoupled Sign Out',
        description:
          'All mobile sidebar icons now use uniform monochrome styling rather than accent colors. The Sign Out button has been detached from viewport bottom-anchoring to sit ergonomically below the controls with a dedicated separator.',
      },
      {
        icon: Tick02Icon,
        title: "Restored What's New & Release Highlights",
        description:
          'Fixed the changelog modal module dependencies, allowing family members to view new feature updates directly inside App Settings.',
      },
    ],
  },
  {
    version: 'v0.2.1',
    title: 'Marketplace Redesign, Full-Page Views & Mobile Navigation',
    tag: 'Previous',
    tagColor: 'bg-[#8E8E93]/20 text-[#636366] dark:text-[#E5E5EA]',
    highlights: [
      {
        icon: PaintBoardIcon,
        title: 'SwiftUI Accent Colors & Festive Card Ambiance',
        description:
          'Added the full suite of SwiftUI accent colors with exact Light and Dark mode hexes. Christmas themes now feature subtle blurred accent circles behind items for festive holiday ambiance without replacing clean card backgrounds.',
      },
      {
        icon: UserGroupIcon,
        title: 'Dynamic Member Counters & Tight Button Grouping',
        description:
          'Member items and filter pills now use tactile dynamic badge designs instead of plain text, and wishlist card buttons are grouped tightly with reduced padding.',
      },
      {
        icon: GiftIcon,
        title: 'Facebook Marketplace-Style Layout',
        description:
          'Dense, clean product grid with square aspect-ratio photography, prominent price-first display, subtle card darkening/lightening on hover, and always-visible Edit Gift and claim action buttons.',
      },
      {
        icon: SparklesIcon,
        title: 'Dedicated Full-Page Workflows',
        description:
          'Adding gifts, editing items, managing family members, and configuring settings now take up full pages with live preview cards instead of cramped popup modals.',
      },
      {
        icon: Tick02Icon,
        title: 'Persistent Mobile Navigation',
        description:
          'Added a dedicated mobile bottom navigation bar with 1-tap switching between My Wishlist, Family, Add Gift, and Settings, plus individual member chip counters.',
      },
    ],
  },
  {
    version: 'v0.2.0',
    title: 'Smart Link Auto-Fill & Modern Floating Island UI',
    tag: 'Previous',
    tagColor: 'bg-[#8E8E93]/20 text-[#636366] dark:text-[#E5E5EA]',
    highlights: [
      {
        icon: SparklesIcon,
        title: 'Smart Link Auto-Fill (Australian Retailers)',
        description:
          'Paste any product link (Amazon.com.au, JB Hi-Fi, Target, Kmart, etc.) to automatically detect the product name, price, and high-res image directly into your wishlist.',
      },
      {
        icon: GiftIcon,
        title: 'Floating Island Navigation Bar',
        description:
          'A modern floating navbar with concentric rounded corners, soft depth shadows, and exact horizontal alignment with the dashboard UI on both desktop and mobile.',
      },
      {
        icon: Tick02Icon,
        title: 'Family Gift Tracking Status Dots',
        description:
          'Easily track your gifting progress: member list badges now display a distinct status dot once you have reserved or purchased a gift for that person.',
      },
      {
        icon: PaintBoardIcon,
        title: 'Merriweather Headings & iOS Radius Alignment',
        description:
          'Upgraded card headings with elegant Merriweather typography, concentric segmented tab corners, and rock-solid grounded modal dialog footers.',
      },
      {
        icon: Shield01Icon,
        title: 'Unified Family & Appearance Settings',
        description:
          'Quick-access shortcuts to jump between Profile Settings and Family Management, with instant admin controls directly in the header.',
      },
    ],
  },
  {
    version: 'v0.1.1',
    title: 'Design Refinements & Admin Enhancements',
    tag: 'Previous',
    tagColor: 'bg-[#8E8E93]/20 text-[#636366] dark:text-[#E5E5EA]',
    highlights: [
      {
        icon: Delete02Icon,
        title: 'Full Family Wishlist Reset',
        description:
          'Admins can now reset all wishlist items and claims across the family from a dedicated Danger Zone with native destructive confirmation dialogs.',
      },
      {
        icon: Shield01Icon,
        title: 'Native App Dialogs',
        description:
          'Replaced all browser popups (window.confirm & alert) with polished in-app native confirmation dialogs matching the Apple HIG aesthetic.',
      },
      {
        icon: SparklesIcon,
        title: 'Drop-down Member Chevron',
        description:
          'Switched member selector collapse toggle to a smooth rotating drop-down chevron icon for a cleaner, more intuitive member browsing experience.',
      },
      {
        icon: PaintBoardIcon,
        title: 'Sidebar Theme Accent & Fluid Animations',
        description:
          'The sidebar Appearance icon now dynamically matches your active holiday accent color, paired with fluid spring slide-in transitions and smooth tab switching.',
      },
      {
        icon: GiftIcon,
        title: 'Refined Typography & Navbar Spacing',
        description:
          'All section eyebrow labels now use clean, non-capitalized Helvetica Neue bold. Family names adapt with expanded responsive breakpoints alongside a 1-tap invite link button.',
      },
    ],
  },
  {
    version: 'v0.1.0',
    title: 'Initial Release — Version 0.1.0 of WhatGift',
    tag: 'Initial Launch',
    tagColor: 'bg-[#8E8E93]/20 text-[#636366] dark:text-[#E5E5EA]',
    highlights: [
      {
        icon: GiftIcon,
        title: 'Family Wishlists & Single-Code Sharing',
        description:
          'Create a family space with a memorable family code, or send direct invite links that immediately log family members into the portal.',
      },
      {
        icon: Shield01Icon,
        title: 'Top Secret Gift Claims Privacy',
        description:
          'Family members can claim or purchase gifts with private notes. The recipient cannot see claims, preserving the surprise completely.',
      },
      {
        icon: SparklesIcon,
        title: 'Rich Wishlist Item Cards',
        description:
          'Add gifts with direct store links, alternate purchasing options, high-res photos, priorities (Low to Must-Have), and on-sale price highlights.',
      },
      {
        icon: PaintBoardIcon,
        title: 'Apple HIG Design & Aura Themes',
        description:
          'Clean Apple-inspired aesthetics with full Dark Mode support and festive ambient aura themes (Christmas, Sapphire, Hanukkah, Sunset, Emerald).',
      },
      {
        icon: Tick02Icon,
        title: 'Zero-Friction Alias Login',
        description:
          'Family members tap their avatar and name to log in immediately without needing cumbersome passwords or phone verification.',
      },
    ],
  },
];
