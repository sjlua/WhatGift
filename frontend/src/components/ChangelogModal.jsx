import React from 'react';
import Modal from './Modal';
import { HugeiconsIcon } from '@hugeicons/react';
import { CHANGELOG_RELEASES } from '../constants/changelog';

export default function ChangelogModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What's New in WhatGift" maxWidth="max-w-lg">
      <div className="space-y-6">
        {CHANGELOG_RELEASES.map((rel, idx) => (
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
