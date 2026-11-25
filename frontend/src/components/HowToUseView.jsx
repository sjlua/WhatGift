import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  CircleQuestionMarkIcon,
  GiftIcon,
  Link01Icon,
  Tick02Icon,
  UserSettings01Icon,
} from '@hugeicons/core-free-icons';

function GuideStep({ number, title, children, actions }) {
  return (
    <li className="flex items-start gap-4 py-4 border-b border-[#E4E6EB] dark:border-[#38383A] last:border-0">
      <span className="w-8 h-8 rounded-full bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[var(--theme-primary)] text-sm font-bold tabular-nums flex items-center justify-center shrink-0">
        {number}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="text-base font-bold text-[#050505] dark:text-[#E4E6EB]">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-[#65676B] dark:text-[#B0B3B8] mt-1">
          {children}
        </p>
        {actions && <div className="flex flex-wrap items-center gap-2 mt-3">{actions}</div>}
      </div>
    </li>
  );
}

function GuideSection({ icon, title, children }) {
  return (
    <section className="pt-6 first:pt-0">
      <div className="flex items-center gap-3 pb-3 border-b border-[#E4E6EB] dark:border-[#38383A]">
        <div className="w-10 h-10 rounded-xl bg-[#F0F2F5] dark:bg-[#2C2C2E] text-[var(--theme-primary)] flex items-center justify-center shrink-0">
          <HugeiconsIcon icon={icon} size={19} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-[#050505] dark:text-[#E4E6EB]">
          {title}
        </h2>
      </div>
      <ol className="mt-1">{children}</ol>
    </section>
  );
}

export default function HowToUseView({
  onBackToWishes,
  onNavigate,
  onCopyInvite,
  onStartNewFamily,
  inviteCopied,
  canManageFamily,
}) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--theme-primary)] text-white flex items-center justify-center shrink-0 shadow-apple-sm">
            <HugeiconsIcon icon={CircleQuestionMarkIcon} size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#050505] dark:text-[#E4E6EB]">
              How to Use WhatGift
            </h1>
            <p className="text-sm text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
              Add a gift or set up a family in a few simple steps.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToWishes}
          className="hidden sm:inline-flex h-10 items-center px-4 rounded-xl text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] border-0 transition"
        >
          Back to Wishlist
        </button>
      </div>

      <div className="divide-y divide-[#E4E6EB] dark:divide-[#38383A]">
        <GuideSection icon={GiftIcon} title="Add a gift to your wishlist">
          <GuideStep
            number="1"
            title="Open Add Gift"
            actions={(
              <button
                type="button"
                onClick={() => onNavigate?.('add-gift')}
                className="h-10 inline-flex items-center gap-1.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition active:scale-[0.98] border-0 shadow-apple-sm"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} />
                <span>Add Gift</span>
              </button>
            )}
          >
            Choose Add Gift from the navigation to open the gift form.
          </GuideStep>
          <GuideStep number="2" title="Add a link or enter the details">
            Paste a product link to fill in available details automatically, or enter the gift name, price, and notes yourself.
          </GuideStep>
          <GuideStep number="3" title="Review and publish">
            Check the details, then publish the gift. It will appear on your wishlist for your family to see.
          </GuideStep>
        </GuideSection>

        <GuideSection icon={UserSettings01Icon} title="Start a new WhatGift Family">
          <GuideStep
            number="1"
            title="Open the family setup form"
            actions={(
              <button
                type="button"
                onClick={onStartNewFamily}
                className="h-10 inline-flex items-center gap-1.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition active:scale-[0.98] border-0 shadow-apple-sm"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} />
                <span>Start a New Family</span>
              </button>
            )}
          >
            This signs you out of the current family and opens the new-family form. You can rejoin your current family later with its invite link.
          </GuideStep>
          <GuideStep number="2" title="Choose your family details">
            Enter a family name and your first name, choose an avatar, and optionally set a custom family code.
          </GuideStep>
          <GuideStep
            number="3"
            title="Invite everyone to join"
            actions={(
              <>
                {canManageFamily && (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('admin')}
                    className="h-10 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] transition active:scale-95 border-0"
                  >
                    <HugeiconsIcon icon={UserSettings01Icon} size={15} />
                    <span>Manage Family</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCopyInvite}
                  className="h-10 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold text-[var(--theme-primary)] bg-[var(--theme-tint)] dark:bg-[var(--theme-tint-dark)] hover:opacity-90 transition border-0"
                >
                  <HugeiconsIcon icon={inviteCopied ? Tick02Icon : Link01Icon} size={15} />
                  <span>{inviteCopied ? 'Copied' : 'Copy Invite Link'}</span>
                </button>
              </>
            )}
          >
            After creating your family, add members in Manage Family and share its invite link with them.
          </GuideStep>
        </GuideSection>
      </div>
    </div>
  );
}
