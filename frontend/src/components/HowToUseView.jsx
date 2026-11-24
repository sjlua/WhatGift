import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  Add01Icon,
  UserGroupIcon,
  Tick02Icon,
  Link01Icon,
  CircleQuestionMarkIcon,
} from '@hugeicons/core-free-icons';

const steps = [
  {
    icon: GiftIcon,
    title: 'Start a wishlist',
    description: 'Open My Wishlist to see the gifts you want to receive.',
    action: 'My Wishlist',
    target: 'my-wishes',
  },
  {
    icon: Add01Icon,
    title: 'Add gifts',
    description: 'Use Add Gift and enter a name, link, price, or note so family knows what you mean.',
    action: 'Add Gift',
    target: 'add-gift',
  },
  {
    icon: Link01Icon,
    title: 'Invite your family',
    description: 'Copy the family invite link and share it with the people you want to coordinate with.',
    action: 'Copy Invite Link',
    target: 'copy-invite',
  },
  {
    icon: UserGroupIcon,
    title: 'Coordinate purchases',
    description: 'Open Family Wishlists, mark an item as purchased or claimed, and avoid duplicate gifts.',
    action: 'Family Wishlists',
    target: 'family-wishes',
  },
  {
    icon: GiftIcon,
    title: 'Keep it updated',
    description: 'Edit or remove items anytime, and ask family to do the same as plans change.',
    action: 'Edit Wishlist',
    target: 'my-wishes',
  },
];

export default function HowToUseView({
  onBackToWishes,
  onNavigate,
  onCopyInvite,
  inviteCopied,
}) {
  const handleShortcut = (target) => {
    if (target === 'copy-invite') {
      onCopyInvite?.();
      return;
    }
    onNavigate?.(target);
  };

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
            className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E4E6EB] dark:border-[#303032] shadow-apple-xs"
          >
            <div className="w-10 h-10 rounded-full bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[var(--theme-primary)] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={step.icon} size={19} />
            </div>
            <div className="min-w-0 flex-1">
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
              <button
                type="button"
                onClick={() => handleShortcut(step.target)}
                className={`mt-3 inline-flex min-h-10 items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition active:scale-[0.98] ${
                  step.target === 'add-gift'
                    ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)] shadow-apple-sm'
                    : 'bg-[#F7F7F8] dark:bg-[#242426] text-[#050505] dark:text-[#E4E6EB] border-[#E4E6EB] dark:border-[#3A3A3C] hover:bg-[#EDEEF0] dark:hover:bg-[#303032]'
                }`}
              >
                {step.target === 'copy-invite' && inviteCopied ? (
                  <HugeiconsIcon icon={Tick02Icon} size={16} className="text-[#34C759]" />
                ) : (
                  <HugeiconsIcon
                    icon={step.icon}
                    size={16}
                    className={step.target === 'add-gift' ? 'text-white' : 'text-[var(--theme-primary)]'}
                  />
                )}
                <span>{step.target === 'copy-invite' && inviteCopied ? 'Copied' : step.action}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
