import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { WebHaptics } from 'web-haptics';

const HapticsContext = createContext(null);

export function HapticsProvider({ children }) {
  const [hapticsEnabled, setHapticsEnabledState] = useState(() => {
    const saved = localStorage.getItem('whatgift_haptics_enabled');
    return saved === null ? true : saved !== 'false';
  });

  const hapticsRef = useRef(null);

  useEffect(() => {
    try {
      hapticsRef.current = new WebHaptics();
    } catch (e) {
      console.warn('[WhatGift] WebHaptics initialization failed:', e);
    }

    return () => {
      if (hapticsRef.current?.destroy) {
        hapticsRef.current.destroy();
      }
    };
  }, []);

  const setHapticsEnabled = (enabled) => {
    setHapticsEnabledState(enabled);
    localStorage.setItem('whatgift_haptics_enabled', enabled ? 'true' : 'false');
    // If enabling, provide an immediate tactile confirmation
    if (enabled && hapticsRef.current) {
      try {
        hapticsRef.current.trigger('medium');
      } catch {}
    }
  };

  const toggleHaptics = () => {
    setHapticsEnabled(!hapticsEnabled);
  };

  const trigger = (pattern = 'light') => {
    if (!hapticsEnabled) return;
    try {
      if (hapticsRef.current) {
        hapticsRef.current.trigger(pattern);
      }
    } catch (e) {
      // Graceful fallback for non-supporting devices
    }
  };

  // Global click delegate: triggers haptic feedback on button clicks
  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!hapticsEnabled) return;

      const target = event.target;
      if (!target || typeof target.closest !== 'function') return;

      const button = target.closest('button, [role="button"], input[type="submit"], input[type="button"]');
      if (button) {
        if (button.dataset.noHaptic) return;
        const pattern = button.dataset.haptic || 'light';
        trigger(pattern);
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true, passive: true });
    };
  }, [hapticsEnabled]);

  return (
    <HapticsContext.Provider
      value={{
        hapticsEnabled,
        setHapticsEnabled,
        toggleHaptics,
        trigger,
        triggerLight: () => trigger('light'),
        triggerMedium: () => trigger('medium'),
        triggerHeavy: () => trigger('heavy'),
        triggerSelection: () => trigger('selection'),
        triggerSuccess: () => trigger('success'),
        triggerWarning: () => trigger('warning'),
        triggerError: () => trigger('error'),
      }}
    >
      {children}
    </HapticsContext.Provider>
  );
}

export function useHaptics() {
  const context = useContext(HapticsContext);
  if (!context) {
    throw new Error('useHaptics must be used within a HapticsProvider');
  }
  return context;
}
