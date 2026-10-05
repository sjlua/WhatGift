import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AVATAR_OPTIONS } from '../constants/avatars';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GiftIcon,
  ArrowRight01Icon,
  AlertCircleIcon,
  Link01Icon,
  Sun01Icon,
  Moon02Icon,
} from '@hugeicons/core-free-icons';

export default function AuthPage() {
  const { login, registerFamily } = useAuth();
  const { theme, isDark, toggleDarkMode } = useTheme();

  const [mode, setMode] = useState('join'); // 'join' | 'create'
  const [familyCode, setFamilyCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoLaunched, setAutoLaunched] = useState(false);

  // Start new family form
  const [createForm, setCreateForm] = useState({
    name: '',
    admin_alias: '',
    admin_avatar: '🎁',
    family_code: '',
  });

  const lookupAndSetFamily = async (codeToLookup) => {
    if (!codeToLookup) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.lookupFamily(codeToLookup);
      setFamilyData(data);
      localStorage.setItem('whatgift_last_family_code', codeToLookup);
    } catch (err) {
      setError(err.message || 'Family not found. Please verify the invite link or code.');
      setFamilyData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-launch family if embedded in URL query (?family=CODE or ?code=CODE) or saved locally
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('family') || params.get('code');
    const rememberedCode = localStorage.getItem('whatgift_last_family_code');
    const targetCode = codeParam ? codeParam.trim().toUpperCase() : (rememberedCode ? rememberedCode.trim().toUpperCase() : '');

    if (targetCode) {
      setFamilyCode(targetCode);
      setMode('join');
      if (codeParam) {
        setAutoLaunched(true);
      }
      lookupAndSetFamily(targetCode);
    }

    const rememberedAlias = localStorage.getItem('whatgift_last_alias');
    if (rememberedAlias) {
      setFirstName(rememberedAlias);
    }
  }, []);

  const handleLookupFamily = (e) => {
    e?.preventDefault();
    lookupAndSetFamily(familyCode.trim().toUpperCase());
  };

  const handleLoginWithName = async (nameToUse) => {
    const targetName = nameToUse || firstName;
    if (!targetName.trim() || !familyData) return;

    setLoading(true);
    setError('');
    try {
      localStorage.setItem('whatgift_last_family_code', familyData.code);
      localStorage.setItem('whatgift_last_alias', targetName.trim());
      await login(familyData.code, targetName.trim());
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, `/?family=${encodeURIComponent(familyData.code)}`);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check the spelling of your first name.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await registerFamily({
        name: createForm.name.trim(),
        admin_alias: createForm.admin_alias.trim(),
        admin_avatar: createForm.admin_avatar,
        family_code: createForm.family_code.trim() || undefined,
      });
      if (resp?.family?.code) {
        localStorage.setItem('whatgift_last_family_code', resp.family.code);
        localStorage.setItem('whatgift_last_alias', createForm.admin_alias.trim());
      }
    } catch (err) {
      setError(err.message || 'Failed to create family');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-[#F2F2F7] dark:bg-[#000000] transition-colors duration-200 relative overflow-hidden">
      {/* Dynamic Ambient Holiday Aura on Login Page */}
      <div
        className="absolute top-0 left-0 right-0 h-96 pointer-events-none transition-all duration-500 opacity-70 dark:opacity-40"
        style={{
          background: isDark
            ? `radial-gradient(ellipse 80% 60% at 50% -20%, ${theme.tintDark || theme.tint}, transparent 70%)`
            : `radial-gradient(ellipse 80% 60% at 50% -20%, ${theme.tint}, transparent 70%)`,
        }}
      />

      {/* Top right quick theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white shadow-apple-sm transition active:scale-95 border-0"
          aria-label="Toggle Dark Mode"
        >
          <HugeiconsIcon icon={isDark ? Sun01Icon : Moon02Icon} size={18} />
        </button>
      </div>

      <div className="w-full max-w-md sm:max-w-lg relative z-10">
        {/* Apple HIG App Header with Festive Christmas Accent */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-apple-md mb-3 transition-transform duration-300 hover:scale-105"
            style={{
              background: 'var(--theme-navbar-bg, var(--theme-primary))',
            }}
          >
            <HugeiconsIcon icon={GiftIcon} size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#1C1C1E] dark:text-white tracking-tight">WhatGift</h1>
          <p className="text-xs sm:text-sm text-[#8E8E93] mt-1 font-medium font-sans">
            Family wishlists and secret gift coordination
          </p>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--theme-tint)] text-[var(--theme-primary)]">
              🎄 {theme.name}
            </span>
          </div>
        </div>

        {/* Card with Clean Apple HIG Elevation and Reduced Borders */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-8 shadow-apple-lg border-0 transition-colors duration-200">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 text-xs sm:text-sm rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] mb-5">
              <HugeiconsIcon icon={AlertCircleIcon} size={17} className="shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Segmented Control - Borderless with Apple HIG Tab Shadow */}
          <div className="flex gap-2 p-1.5 bg-[#E5E5EA]/70 dark:bg-[#2C2C2E] rounded-2xl shadow-inner mb-6 border-0">
            <button
              type="button"
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm transition-all duration-150 rounded-xl border-0 ${
                mode === 'join'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-apple-tab font-bold ring-1 ring-black/[0.04]'
                  : 'text-[#636366] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-white/40 font-semibold'
              }`}
            >
              Enter Family
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm transition-all duration-150 rounded-xl border-0 ${
                mode === 'create'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-apple-tab font-bold ring-1 ring-black/[0.04]'
                  : 'text-[#636366] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-white/40 font-semibold'
              }`}
            >
              Start New Family
            </button>
          </div>

          {mode === 'join' ? (
            /* ==========================================
               ENTER FAMILY (Direct First Name Login)
               ========================================== */
            <div>
              {!familyData ? (
                /* Step 1: Family Code Form */
                <form onSubmit={handleLookupFamily} className="space-y-4">
                  <div>
                    <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5 flex items-center">
                      <span>Family Code</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF453A]/20 dark:text-[#FF453A] ml-1.5">
                        Required
                      </span>
                    </label>
                    <input
                      type="text"
                      autoCapitalize="characters"
                      placeholder="e.g. MELBY-2026"
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                      className="w-full uppercase font-mono tracking-wider px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm sm:text-base text-[#1C1C1E] dark:text-white focus:outline-none shadow-apple-sm transition"
                      required
                    />
                    <p className="text-xs text-[#8E8E93] mt-1.5">
                      Enter the code provided by your family admin or open an invite link.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !familyCode.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Finding Family...' : 'Continue'}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </form>
              ) : (
                /* Step 2: Auto-Launched Family Portal (Direct First-Name Login) */
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-[#1C1C1E] dark:text-white text-lg sm:text-xl leading-tight">
                          {familyData.name}
                        </h3>
                        {autoLaunched && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--theme-tint)] text-[var(--theme-primary)] border-0">
                            <HugeiconsIcon icon={Link01Icon} size={11} /> Link
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#8E8E93] font-mono">Code: {familyData.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFamilyData(null);
                        setAutoLaunched(false);
                      }}
                      className="text-xs sm:text-sm text-[var(--theme-primary)] hover:underline font-bold"
                    >
                      Change
                    </button>
                  </div>

                  {/* Type First Name */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleLoginWithName();
                    }}
                    className="space-y-3.5"
                  >
                    <div>
                      <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5 flex items-center">
                        <span>Type Your First Name</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF453A]/20 dark:text-[#FF453A] ml-1.5">
                          Required
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Sean, Chloe, Dad"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm sm:text-base text-[#1C1C1E] dark:text-white focus:outline-none shadow-apple-sm transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !firstName.trim()}
                      className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'Logging in...' : 'Log In'}
                    </button>
                  </form>

                  {/* Or tap from family list for 1-tap convenience */}
                  {familyData.members.length > 0 && (
                    <div className="pt-2">
                      <p className="font-sans font-bold text-xs text-[#8E8E93] dark:text-[#A1A1A6] mb-2.5 text-center">
                        Or tap your name:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {familyData.members.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setFirstName(member.alias);
                              handleLoginWithName(member.alias);
                            }}
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] border-0 shadow-apple-sm transition active:scale-95 text-left"
                          >
                            <span className="text-2xl leading-none">{member.avatar || '🎁'}</span>
                            <span className="font-bold text-xs sm:text-sm text-[#1C1C1E] dark:text-white truncate">
                              {member.alias}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ==========================================
               START NEW FAMILY
               ========================================== */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5 flex items-center">
                  <span>Family Name</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF453A]/20 dark:text-[#FF453A] ml-1.5">
                    Required
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Melbourne Family"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white focus:outline-none shadow-apple-sm transition"
                />
              </div>

              <div>
                <label className="block font-sans font-bold text-xs sm:text-[13px] text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5 flex items-center">
                  <span>Your First Name</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF453A]/20 dark:text-[#FF453A] ml-1.5">
                    Required
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sean"
                  value={createForm.admin_alias}
                  onChange={(e) => setCreateForm({ ...createForm, admin_alias: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white focus:outline-none shadow-apple-sm transition"
                />
              </div>

              {/* Profile Avatar Selection */}
              <div>
                <label className="block font-sans font-bold text-xs text-[#8E8E93] dark:text-[#A1A1A6] mb-2">
                  Your Profile Avatar
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, admin_avatar: emoji })}
                      className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition border-0 ${
                        createForm.admin_avatar === emoji
                          ? 'bg-[var(--theme-tint)] shadow-apple-md ring-2 ring-[var(--theme-primary)] scale-105'
                          : 'bg-white dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] shadow-apple-sm'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-sans font-bold text-xs text-[#8E8E93] dark:text-[#A1A1A6] mb-1.5">
                  Custom Family Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MELBY-2026"
                  value={createForm.family_code}
                  onChange={(e) => setCreateForm({ ...createForm, family_code: e.target.value.toUpperCase() })}
                  className="w-full uppercase font-mono px-4 py-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-0 focus:ring-2 focus:ring-[var(--theme-primary)] focus:bg-white dark:focus:bg-[#38383A] text-sm text-[#1C1C1E] dark:text-white focus:outline-none shadow-apple-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !createForm.name.trim() || !createForm.admin_alias.trim()}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-hover)] border-0 shadow-apple-md transition disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Family...' : 'Start Family Wishlist'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
