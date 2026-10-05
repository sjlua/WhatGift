import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'christmas_duo',
    name: 'Christmas Classic',
    holiday: 'Christmas / Red & Green',
    isEvent: true,
    primary: '#DC2626',
    primaryDark: '#EF4444',
    secondary: '#16A34A',
    hover: '#B91C1C',
    navbarBg: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 52%, #15803D 100%)',
    navbarBgDark: 'linear-gradient(135deg, #4E1015 0%, #38080B 52%, #0C2B17 100%)',
    navbarBgFlat: '#B91C1C',
    navbarBgDarkFlat: '#38080B',
    tint: 'rgba(220, 38, 38, 0.14)',
    tintDark: 'rgba(239, 68, 68, 0.22)',
    border: 'rgba(220, 38, 38, 0.35)',
    swatch: '#DC2626',
    swatches: ['#DC2626', '#16A34A'],
    gradient: 'linear-gradient(90deg, #DC2626 0%, #16A34A 100%)',
  },
  {
    id: 'apple',
    name: 'Apple Classic',
    holiday: 'Default / Everyday',
    isEvent: false,
    primary: '#0071E3',
    primaryDark: '#0A84FF',
    hover: '#005BB5',
    navbarBg: '#0071E3',
    navbarBgDark: '#0B2A4A',
    navbarBgFlat: '#0071E3',
    navbarBgDarkFlat: '#0B2A4A',
    tint: 'rgba(0, 113, 227, 0.12)',
    tintDark: 'rgba(10, 132, 255, 0.20)',
    border: 'rgba(0, 113, 227, 0.35)',
    swatch: '#0071E3',
  },
  {
    id: 'birthday',
    name: 'Birthday Fiesta',
    holiday: 'Birthday / Festive Blue & Gold',
    isEvent: true,
    primary: '#2563EB',
    primaryDark: '#60A5FA',
    secondary: '#EAB308',
    hover: '#1D4ED8',
    navbarBg: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 55%, #D97706 100%)',
    navbarBgDark: 'linear-gradient(135deg, #172554 0%, #1E3A8A 55%, #78350F 100%)',
    navbarBgFlat: '#2563EB',
    navbarBgDarkFlat: '#172554',
    tint: 'rgba(37, 99, 235, 0.14)',
    tintDark: 'rgba(96, 165, 250, 0.22)',
    border: 'rgba(37, 99, 235, 0.35)',
    swatch: '#2563EB',
    swatches: ['#2563EB', '#EAB308'],
    gradient: 'linear-gradient(90deg, #2563EB 0%, #EAB308 100%)',
  },
  {
    id: 'christmas',
    name: 'Crimson Holiday',
    holiday: 'Christmas / Red Velvet',
    isEvent: false,
    primary: '#DC2626',
    primaryDark: '#EF4444',
    hover: '#B91C1C',
    navbarBg: '#DC2626',
    navbarBgDark: '#30070A',
    navbarBgFlat: '#DC2626',
    navbarBgDarkFlat: '#30070A',
    tint: 'rgba(220, 38, 38, 0.14)',
    tintDark: 'rgba(239, 68, 68, 0.22)',
    border: 'rgba(220, 38, 38, 0.35)',
    swatch: '#DC2626',
  },
  {
    id: 'hanukkah',
    name: 'Winter Sapphire',
    holiday: 'Hanukkah / Winter',
    isEvent: false,
    primary: '#0284C7',
    primaryDark: '#38BDF8',
    hover: '#0369A1',
    navbarBg: '#0284C7',
    navbarBgDark: '#051F2C',
    navbarBgFlat: '#0284C7',
    navbarBgDarkFlat: '#051F2C',
    tint: 'rgba(2, 132, 199, 0.14)',
    tintDark: 'rgba(56, 189, 248, 0.22)',
    border: 'rgba(2, 132, 199, 0.35)',
    swatch: '#0284C7',
  },
  {
    id: 'halloween',
    name: 'Pumpkin Harvest',
    holiday: 'Halloween / Autumn',
    isEvent: false,
    primary: '#EA580C',
    primaryDark: '#FB923C',
    hover: '#C2410C',
    navbarBg: '#EA580C',
    navbarBgDark: '#260A03',
    navbarBgFlat: '#EA580C',
    navbarBgDarkFlat: '#260A03',
    tint: 'rgba(234, 88, 12, 0.14)',
    tintDark: 'rgba(251, 146, 60, 0.22)',
    border: 'rgba(234, 88, 12, 0.35)',
    swatch: '#EA580C',
  },
  {
    id: 'valentine',
    name: 'Rose Blush',
    holiday: 'Valentine / Love',
    isEvent: false,
    primary: '#E11D48',
    primaryDark: '#FB7185',
    hover: '#BE123C',
    navbarBg: '#E11D48',
    navbarBgDark: '#2C030D',
    navbarBgFlat: '#E11D48',
    navbarBgDarkFlat: '#2C030D',
    tint: 'rgba(225, 29, 72, 0.14)',
    tintDark: 'rgba(251, 113, 133, 0.22)',
    border: 'rgba(225, 29, 72, 0.35)',
    swatch: '#E11D48',
  },
  {
    id: 'pine',
    name: 'Pine Evergreen',
    holiday: 'Winter Woodland',
    isEvent: false,
    primary: '#16A34A',
    primaryDark: '#4ADE80',
    hover: '#15803D',
    navbarBg: '#16A34A',
    navbarBgDark: '#032010',
    navbarBgFlat: '#16A34A',
    navbarBgDarkFlat: '#032010',
    tint: 'rgba(22, 163, 74, 0.14)',
    tintDark: 'rgba(74, 222, 128, 0.22)',
    border: 'rgba(22, 163, 74, 0.35)',
    swatch: '#16A34A',
  },
  {
    id: 'newyear',
    name: 'Midnight Gold',
    holiday: 'New Year / Elegant',
    isEvent: false,
    primary: '#D97706',
    primaryDark: '#FBBF24',
    hover: '#B45309',
    navbarBg: '#D97706',
    navbarBgDark: '#201202',
    navbarBgFlat: '#D97706',
    navbarBgDarkFlat: '#201202',
    tint: 'rgba(217, 119, 6, 0.14)',
    tintDark: 'rgba(251, 191, 36, 0.22)',
    border: 'rgba(217, 119, 6, 0.35)',
    swatch: '#D97706',
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem('whatgift_theme');
    const isCustomized = localStorage.getItem('whatgift_theme_customized');
    if (!saved || (!isCustomized && saved === 'apple')) {
      return 'christmas_duo';
    }
    return saved;
  });

  const [darkMode, setDarkModeState] = useState(() => {
    return localStorage.getItem('whatgift_dark_mode') || 'system';
  });

  const [isSystemDark, setIsSystemDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to OS system dark mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const [uiScale, setUiScaleState] = useState(() => {
    return localStorage.getItem('whatgift_ui_scale') || 'default'; // 'compact' | 'default' | 'spacious' | 'large'
  });

  const setUiScale = (scale) => {
    setUiScaleState(scale);
    localStorage.setItem('whatgift_ui_scale', scale);
  };

  const isDark = darkMode === 'dark' || (darkMode === 'system' && isSystemDark);

  const setDarkMode = (mode) => {
    setDarkModeState(mode);
    localStorage.setItem('whatgift_dark_mode', mode);
  };

  const toggleDarkMode = () => {
    setDarkMode(isDark ? 'light' : 'dark');
  };

  const activeTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  useEffect(() => {
    localStorage.setItem('whatgift_theme', themeId);

    const root = document.documentElement;
    const body = document.body;

    const currentPrimary = isDark ? (activeTheme.primaryDark || activeTheme.primary) : activeTheme.primary;
    const currentNavbarBg = isDark
      ? (activeTheme.navbarBgDark || activeTheme.primary)
      : (activeTheme.navbarBg || activeTheme.primary);

    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', currentPrimary);
    root.style.setProperty('--theme-hover', activeTheme.hover);
    root.style.setProperty('--theme-navbar-bg', currentNavbarBg);
    root.style.setProperty('--theme-tint', activeTheme.tint);
    root.style.setProperty('--theme-tint-dark', activeTheme.tintDark || activeTheme.tint);
    root.style.setProperty('--theme-border', activeTheme.border);

    // Apply dark class and data-theme to BOTH <html> and <body>
    if (isDark) {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      root.style.backgroundColor = '#0A0A0C';
      if (body) body.style.backgroundColor = '#0A0A0C';
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      root.style.backgroundColor = '#F8F8FA';
      if (body) body.style.backgroundColor = '#F8F8FA';
    }

    // Update browser theme-color meta tag so browser status bar matches navbar accent
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDark
          ? (activeTheme.navbarBgDarkFlat || '#000000')
          : (activeTheme.navbarBgFlat || activeTheme.primary)
      );
    }
  }, [themeId, activeTheme, isDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-ui-scale', uiScale);
  }, [uiScale]);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        themeId,
        setThemeId,
        themes: THEMES,
        darkMode,
        setDarkMode,
        toggleDarkMode,
        isDark,
        uiScale,
        setUiScale,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
