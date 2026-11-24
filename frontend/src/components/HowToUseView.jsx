import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  Add01Icon,
  UserGroupIcon,
  Tick02Icon,
  CircleQuestionMarkIcon,
} from '@hugeicons/core-free-icons';

const steps = [
  {
    icon: GiftIcon,
    title: 'Start a wishlist',
    description: 'Open My Wishlist to see the gifts you want to receive.',
  },
  {
    icon: Add01Icon,
    title: 'Add gifts',
    description: 'Use Add Gift and enter a name, link, price, or note so family knows what you mean.',
  },
  {
    icon: UserGroupIcon,
    title: 'Invite your family',
    description: 'Copy the family invite link and share it with the people you want to coordinate with.',
  },
  {
    icon: Tick02Icon,
    title: 'Coordinate purchases',
    description: 'Open Family Wishlists, mark an item as purchased or claimed, and avoid duplicate gifts.',
  },
  {
    icon: GiftIcon,
    title: 'Keep it updated',
    description: 'Edit or remove items anytime, and ask family to do the same as plans change.',
  },
];

export default function HowToUseView({ onBackToWishes }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--theme-primary)] text-white flex items-center justify-center shrink-0 shadow-apple-sm">
            <HugeiconsIcon icon={CircleQuestionMarkIcon} size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB]">
              How to Use WhatGift
            </h2>
            <p className="text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
              A quick guide to creating and sharing wishlists.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToWishes}
          className="hidden sm:inline-flex h-10 items-center px-4 rounded-xl text-sm font-semibold text-[var(--theme-primary)] bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] border-0 hover:opacity-90 transition"
        >
          Back to Wishlist
        </button>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#242526] border border-[#E4E6EB] dark:border-[#3A3B3C] shadow-apple-xs"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] text-[var(--theme-primary)] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={step.icon} size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold tabular-nums text-[var(--theme-primary)]">
                  {index + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#050505] dark:text-[#E4E6EB]">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-[#65676B] dark:text-[#B0B3B8] mt-1">
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
