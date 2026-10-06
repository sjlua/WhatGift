import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'christmas_duo',
    name: 'Christmas Classic',
    holiday: 'Christmas / Red & Green',
    isEvent: true,
    primary: '#FF3B30',
    primaryDark: '#FF453A',
    secondary: '#34C759',
    secondaryDark: '#30D158',
    hover: '#E02E24',
    navbarBg: 'linear-gradient(135deg, #FF3B30 0%, #D32F2F 52%, #34C759 100%)',
    navbarBgDark: 'linear-gradient(135deg, #3A0D10 0%, #2A080A 52%, #0A2412 100%)',
    navbarBgFlat: '#FF3B30',
    navbarBgDarkFlat: '#2A080A',
    tint: 'rgba(255, 59, 48, 0.14)',
    tintDark: 'rgba(255, 69, 58, 0.22)',
    border: 'rgba(255, 59, 48, 0.35)',
    swatch: '#FF3B30',
    swatches: ['#FF3B30', '#34C759'],
    gradient: 'linear-gradient(90deg, #FF3B30 0%, #34C759 100%)',
  },
  {
    id: 'apple',
    name: 'Apple Classic',
    holiday: 'Default / Blue',
    isEvent: false,
    primary: '#007AFF',
    primaryDark: '#0A84FF',
    hover: '#0066D6',
    navbarBg: '#007AFF',
    navbarBgDark: '#0B2A4A',
    navbarBgFlat: '#007AFF',
    navbarBgDarkFlat: '#0B2A4A',
    tint: 'rgba(0, 122, 255, 0.14)',
    tintDark: 'rgba(10, 132, 255, 0.22)',
    border: 'rgba(0, 122, 255, 0.35)',
    swatch: '#007AFF',
  },
  {
    id: 'birthday',
    name: 'Birthday Fiesta',
    holiday: 'Birthday / Festive Blue & Yellow',
    isEvent: true,
    primary: '#007AFF',
    primaryDark: '#0A84FF',
    secondary: '#FFCC00',
    secondaryDark: '#FFD60A',
    hover: '#0066D6',
    navbarBg: 'linear-gradient(135deg, #007AFF 0%, #0066D6 55%, #FFCC00 100%)',
    navbarBgDark: 'linear-gradient(135deg, #0A2040 0%, #0D2D5E 55%, #423000 100%)',
    navbarBgFlat: '#007AFF',
    navbarBgDarkFlat: '#0A2040',
    tint: 'rgba(0, 122, 255, 0.14)',
    tintDark: 'rgba(10, 132, 255, 0.22)',
    border: 'rgba(0, 122, 255, 0.35)',
    swatch: '#007AFF',
    swatches: ['#007AFF', '#FFCC00'],
    gradient: 'linear-gradient(90deg, #007AFF 0%, #FFCC00 100%)',
  },
  {
    id: 'christmas',
    name: 'Crimson Holiday',
    holiday: 'Christmas / Red Velvet',
    isEvent: false,
    primary: '#FF3B30',
    primaryDark: '#FF453A',
    hover: '#E02E24',
    navbarBg: '#FF3B30',
    navbarBgDark: '#30070A',
    navbarBgFlat: '#FF3B30',
    navbarBgDarkFlat: '#30070A',
    tint: 'rgba(255, 59, 48, 0.14)',
    tintDark: 'rgba(255, 69, 58, 0.22)',
    border: 'rgba(255, 59, 48, 0.35)',
    swatch: '#FF3B30',
  },
  {
    id: 'hanukkah',
    name: 'Winter Cyan',
    holiday: 'Hanukkah / Cyan',
    isEvent: false,
    primary: '#32ADE6',
    primaryDark: '#64D2FF',
    hover: '#2899CE',
    navbarBg: '#32ADE6',
    navbarBgDark: '#062130',
    navbarBgFlat: '#32ADE6',
    navbarBgDarkFlat: '#062130',
    tint: 'rgba(50, 173, 230, 0.14)',
    tintDark: 'rgba(100, 210, 255, 0.22)',
    border: 'rgba(50, 173, 230, 0.35)',
    swatch: '#32ADE6',
  },
  {
    id: 'halloween',
    name: 'Pumpkin Harvest',
    holiday: 'Halloween / Orange',
    isEvent: false,
    primary: '#FF9500',
    primaryDark: '#FF9F0A',
    hover: '#E08500',
    navbarBg: '#FF9500',
    navbarBgDark: '#2C1402',
    navbarBgFlat: '#FF9500',
    navbarBgDarkFlat: '#2C1402',
    tint: 'rgba(255, 149, 0, 0.14)',
    tintDark: 'rgba(255, 159, 10, 0.22)',
    border: 'rgba(255, 149, 0, 0.35)',
    swatch: '#FF9500',
  },
  {
    id: 'valentine',
    name: 'Rose Blush',
    holiday: 'Valentine / Pink',
    isEvent: false,
    primary: '#FF2D55',
    primaryDark: '#FF375F',
    hover: '#E02247',
    navbarBg: '#FF2D55',
    navbarBgDark: '#2C030D',
    navbarBgFlat: '#FF2D55',
    navbarBgDarkFlat: '#2C030D',
    tint: 'rgba(255, 45, 85, 0.14)',
    tintDark: 'rgba(255, 55, 95, 0.22)',
    border: 'rgba(255, 45, 85, 0.35)',
    swatch: '#FF2D55',
  },
  {
    id: 'pine',
    name: 'Pine Evergreen',
    holiday: 'Winter Woodland / Green',
    isEvent: false,
    primary: '#34C759',
    primaryDark: '#30D158',
    hover: '#2EB04E',
    navbarBg: '#34C759',
    navbarBgDark: '#032010',
    navbarBgFlat: '#34C759',
    navbarBgDarkFlat: '#032010',
    tint: 'rgba(52, 199, 89, 0.14)',
    tintDark: 'rgba(48, 209, 88, 0.22)',
    border: 'rgba(52, 199, 89, 0.35)',
    swatch: '#34C759',
  },
  {
    id: 'newyear',
    name: 'Midnight Gold',
    holiday: 'New Year / Yellow',
    isEvent: false,
    primary: '#FFCC00',
    primaryDark: '#FFD60A',
    hover: '#E5B800',
    navbarBg: '#FFCC00',
    navbarBgDark: '#201202',
    navbarBgFlat: '#FFCC00',
    navbarBgDarkFlat: '#201202',
    tint: 'rgba(255, 204, 0, 0.14)',
    tintDark: 'rgba(255, 214, 10, 0.22)',
    border: 'rgba(255, 204, 0, 0.35)',
    swatch: '#FFCC00',
  },
  {
    id: 'mint',
    name: 'Fresh Mint',
    holiday: 'Spring / Mint',
    isEvent: false,
    primary: '#00C7BE',
    primaryDark: '#63E6E2',
    hover: '#00B3AB',
    navbarBg: '#00C7BE',
    navbarBgDark: '#022422',
    navbarBgFlat: '#00C7BE',
    navbarBgDarkFlat: '#022422',
    tint: 'rgba(0, 199, 190, 0.14)',
    tintDark: 'rgba(99, 230, 226, 0.22)',
    border: 'rgba(0, 199, 190, 0.35)',
    swatch: '#00C7BE',
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    holiday: 'Coastal / Teal',
    isEvent: false,
    primary: '#30B0C7',
    primaryDark: '#40C8E0',
    hover: '#289CB1',
    navbarBg: '#30B0C7',
    navbarBgDark: '#042025',
    navbarBgFlat: '#30B0C7',
    navbarBgDarkFlat: '#042025',
    tint: 'rgba(48, 176, 199, 0.14)',
    tintDark: 'rgba(64, 200, 224, 0.22)',
    border: 'rgba(48, 176, 199, 0.35)',
    swatch: '#30B0C7',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    holiday: 'Twilight / Indigo',
    isEvent: false,
    primary: '#5856D6',
    primaryDark: '#5E5CE6',
    hover: '#4D4BC2',
    navbarBg: '#5856D6',
    navbarBgDark: '#131230',
    navbarBgFlat: '#5856D6',
    navbarBgDarkFlat: '#131230',
    tint: 'rgba(88, 86, 214, 0.14)',
    tintDark: 'rgba(94, 92, 230, 0.22)',
    border: 'rgba(88, 86, 214, 0.35)',
    swatch: '#5856D6',
  },
  {
    id: 'purple',
    name: 'Electric Purple',
    holiday: 'Celebration / Purple',
    isEvent: false,
    primary: '#AF52DE',
    primaryDark: '#BF5AF2',
    hover: '#9B44C6',
    navbarBg: '#AF52DE',
    navbarBgDark: '#240B30',
    navbarBgFlat: '#AF52DE',
    navbarBgDarkFlat: '#240B30',
    tint: 'rgba(175, 82, 222, 0.14)',
    tintDark: 'rgba(191, 90, 242, 0.22)',
    border: 'rgba(175, 82, 222, 0.35)',
    swatch: '#AF52DE',
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
      root.style.backgroundColor = '#18191A';
      if (body) body.style.backgroundColor = '#18191A';
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      root.style.backgroundColor = '#FFFFFF';
      if (body) body.style.backgroundColor = '#FFFFFF';
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
