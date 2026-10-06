import React from 'react';
import Modal from './Modal';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  SparklesIcon,
  GiftIcon,
  Shield01Icon,
  PaintBoardIcon,
  Tick02Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';

export default function ChangelogModal({ isOpen, onClose }) {
  const releases = [
    {
      version: 'v2.1.0',
      title: 'Marketplace Redesign, Full-Page Views & Mobile Navigation',
      tag: 'Latest',
      tagColor: 'bg-[var(--theme-primary)] text-white',
      highlights: [
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
        {
          icon: PaintBoardIcon,
          title: 'Harmonized Theme Highlights',
          description:
            'Active sidebar selections, pills, and navigation highlights now dynamically match your active holiday accent color instead of hardcoded blue.',
        },
        {
          icon: Delete02Icon,
          title: 'Desktop Sidebar & Danger Zone Refinements',
          description:
            'Moved family management directly into the Family Members sidebar section on desktop, and placed the wishlist reset Danger Zone at the bottom of the page.',
        },
      ],
    },
    {
      version: 'v2.0.0',
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
      version: 'v1.1.0',
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
      version: 'v1.0.0',
      title: 'Initial Release — Version 1 of WhatGift',
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What's New in WhatGift" maxWidth="max-w-lg">
      <div className="space-y-6">
        {releases.map((rel, idx) => (
          <div
            key={rel.version}
            className={`space-y-3.5 ${
              idx !== 0 ? 'pt-6 border-t border-[#E5E5EA] dark:border-[#2C2C2E]' : ''
            }`}
          >
            {/* Version Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-lg text-[#1C1C1E] dark:text-white">
                  {rel.version}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rel.tagColor}`}>
                  {rel.tag}
                </span>
              </div>
            </div>

            <div className="text-xs font-semibold text-[#8E8E93] dark:text-[#A1A1A6]">
              {rel.title}
            </div>

            {/* Feature List */}
            <div className="space-y-2.5">
              {rel.highlights.map((feat) => (
                <div
                  key={feat.title}
                  className="p-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <HugeiconsIcon icon={feat.icon} size={15} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#050505] dark:text-[#E4E6EB]">
                      {feat.title}
                    </h5>
                    <p className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] mt-0.5 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </Modal>
  );
}
