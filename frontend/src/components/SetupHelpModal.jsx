import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { useHaptics } from '../context/HapticsContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CircleQuestionMarkIcon,
  UserGroupIcon,
  Link01Icon,
  SparklesIcon,
  GiftIcon,
  Tick02Icon,
  Add01Icon,
  Copy01Icon,
} from '@hugeicons/core-free-icons';

export default function SetupHelpModal({ isOpen, onClose, onNavigateToAdmin }) {
  const { family } = useAuth();
  const { triggerSuccess, triggerLight } = useHaptics();
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?family=${encodeURIComponent(family?.code || '')}`;

  const handleCopyLink = () => {
    if (!family?.code) return;
    navigator.clipboard.writeText(inviteUrl);
    triggerSuccess?.();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGoToAddMember = () => {
    triggerLight?.();
    onClose();
    if (onNavigateToAdmin) {
      onNavigateToAdmin();
    }
  };

  const steps = [
    {
      step: 1,
      title: 'Add Family Members',
      badge: 'Important First Step',
      badgeColor: 'bg-[var(--theme-primary)] text-white',
      icon: UserGroupIcon,
      description:
        'Pre-add each family member (grandparents, parents, kids, partners) with their first name and a fun avatar emoji. This allows them to join WhatGift with a single tap of their name—no emails, passwords, or registration needed!',
      action: (
        <button
          type="button"
          onClick={handleGoToAddMember}
          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] rounded-lg transition border-0 shadow-apple-xs active:scale-95"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          <span>Add Family Members in Admin</span>
        </button>
      ),
    },
    {
      step: 2,
      title: 'Share the Family Invite Link',
      badge: 'Easy Joining',
      badgeColor: 'bg-[#34C759]/15 text-[#1B8036] dark:text-[#30D158]',
      icon: Link01Icon,
      description:
        'Send your unique family invite link to your group chat (WhatsApp, iMessage, SMS). When family members click it, your family circle is automatically loaded and ready to go.',
      action: (
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="flex-1 font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#CCD0D5] dark:border-[#4E4F50] text-[#050505] dark:text-[#E4E6EB] select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] rounded-lg transition border-0 shrink-0 inline-flex items-center gap-1 active:scale-95"
          >
            {copiedLink ? (
              <>
                <HugeiconsIcon icon={Tick02Icon} size={13} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Copy01Icon} size={13} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      ),
    },
    {
      step: 3,
      title: 'Build Wishlists with Smart Auto-Fill',
      badge: 'Auto-Detect',
      badgeColor: 'bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF]',
      icon: SparklesIcon,
      description:
        'Family members tap "Add Gift" and paste any product link from Amazon, JB Hi-Fi, Target, Kmart, or elsewhere. WhatGift automatically fills in the title, price, and product photo.',
    },
    {
      step: 4,
      title: 'Coordinate Claims in Top Secret',
      badge: 'Preserve Surprise',
      badgeColor: 'bg-[#FF9500]/15 text-[#A66200] dark:text-[#FFB340]',
      icon: GiftIcon,
      description:
        'Browse family members\' wishlists and secretly mark gifts as "Want to Buy" or "Bought". Family members coordinate to prevent duplicate gifts, while the recipient will never see what was marked for them.',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How to Set Up WhatGift"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Intro banner */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-tint)]/60 text-[#1C1C1E] dark:text-white border-0">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--theme-primary)] text-white flex items-center justify-center shrink-0 mt-0.5">
              <HugeiconsIcon icon={CircleQuestionMarkIcon} size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-[#050505] dark:text-[#E4E6EB]">
                Family Setup Checklist
              </h4>
              <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-0.5 leading-relaxed">
                Follow these simple steps to get <strong>{family?.name || 'your family'}</strong> set up and exchanging gifts without confusion or spoiled surprises.
              </p>
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="p-3.5 sm:p-4 rounded-xl bg-[#F0F2F5] dark:bg-[#242526] border-0 space-y-1.5 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--theme-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {item.step}
                  </span>
                  <h5 className="text-xs sm:text-sm font-bold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-1.5">
                    <HugeiconsIcon icon={item.icon} size={16} className="text-[var(--theme-primary)] shrink-0" />
                    <span>{item.title}</span>
                  </h5>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] leading-relaxed pl-8">
                {item.description}
              </p>

              {item.action && (
                <div className="pl-8 pt-0.5">
                  {item.action}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] transition border-0 text-center"
          >
            Got It, Let's Go!
          </button>
        </div>
      </div>
    </Modal>
  );
}
