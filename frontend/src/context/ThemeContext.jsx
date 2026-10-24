import React, { createContext, useContext, useState, useEffect } from 'react';

export function getChristmasCountdown() {
  const now = new Date();
  const currentYear = now.getFullYear();
  let christmas = new Date(currentYear, 11, 25);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today.getTime() > christmas.getTime()) {
    christmas = new Date(currentYear + 1, 11, 25);
  }
  const diffMs = christmas.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

const isSouthernHemisphere = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return /Australia|Sydney|Melbourne|Brisbane|Perth|Adelaide|Hobart|Darwin|Auckland|Pacific|Argentina|Sao_Paulo|Johannesburg/i.test(tz);
  } catch {
    return false;
  }
};

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
    navbarBg: '#FF3B30',
    navbarBgDark: '#2A080A',
    navbarBgFlat: '#FF3B30',
    navbarBgDarkFlat: '#2A080A',
    headerBg: 'rgba(255, 59, 48, 0.08)',
    headerBgDark: 'rgba(255, 69, 58, 0.16)',
    headerBorder: 'rgba(255, 59, 48, 0.18)',
    headerBorderDark: 'rgba(255, 69, 58, 0.28)',
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
    headerBg: 'rgba(0, 122, 255, 0.08)',
    headerBgDark: 'rgba(10, 132, 255, 0.16)',
    headerBorder: 'rgba(0, 122, 255, 0.18)',
    headerBorderDark: 'rgba(10, 132, 255, 0.28)',
    tint: 'rgba(0, 122, 255, 0.14)',
    tintDark: 'rgba(10, 132, 255, 0.22)',
    border: 'rgba(0, 122, 255, 0.35)',
    swatch: '#007AFF',
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
    headerBg: 'rgba(255, 59, 48, 0.08)',
    headerBgDark: 'rgba(255, 69, 58, 0.16)',
    headerBorder: 'rgba(255, 59, 48, 0.18)',
    headerBorderDark: 'rgba(255, 69, 58, 0.28)',
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
    headerBg: 'rgba(50, 173, 230, 0.08)',
    headerBgDark: 'rgba(100, 210, 255, 0.16)',
    headerBorder: 'rgba(50, 173, 230, 0.18)',
    headerBorderDark: 'rgba(100, 210, 255, 0.28)',
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
    headerBg: 'rgba(255, 149, 0, 0.08)',
    headerBgDark: 'rgba(255, 159, 10, 0.16)',
    headerBorder: 'rgba(255, 149, 0, 0.18)',
    headerBorderDark: 'rgba(255, 159, 10, 0.28)',
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
    headerBg: 'rgba(255, 45, 85, 0.08)',
    headerBgDark: 'rgba(255, 55, 95, 0.16)',
    headerBorder: 'rgba(255, 45, 85, 0.18)',
    headerBorderDark: 'rgba(255, 55, 95, 0.28)',
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
    headerBg: 'rgba(52, 199, 89, 0.08)',
    headerBgDark: 'rgba(48, 209, 88, 0.16)',
    headerBorder: 'rgba(52, 199, 89, 0.18)',
    headerBorderDark: 'rgba(48, 209, 88, 0.28)',
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
    headerBg: 'rgba(255, 204, 0, 0.08)',
    headerBgDark: 'rgba(255, 214, 10, 0.16)',
    headerBorder: 'rgba(255, 204, 0, 0.18)',
    headerBorderDark: 'rgba(255, 214, 10, 0.28)',
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
    headerBg: 'rgba(0, 199, 190, 0.08)',
    headerBgDark: 'rgba(99, 230, 226, 0.16)',
    headerBorder: 'rgba(0, 199, 190, 0.18)',
    headerBorderDark: 'rgba(99, 230, 226, 0.28)',
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
    headerBg: 'rgba(48, 176, 199, 0.08)',
    headerBgDark: 'rgba(64, 200, 224, 0.16)',
    headerBorder: 'rgba(48, 176, 199, 0.18)',
    headerBorderDark: 'rgba(64, 200, 224, 0.28)',
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
    headerBg: 'rgba(88, 86, 214, 0.08)',
    headerBgDark: 'rgba(94, 92, 230, 0.16)',
    headerBorder: 'rgba(88, 86, 214, 0.18)',
    headerBorderDark: 'rgba(94, 92, 230, 0.28)',
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
    headerBg: 'rgba(175, 82, 222, 0.08)',
    headerBgDark: 'rgba(191, 90, 242, 0.16)',
    headerBorder: 'rgba(175, 82, 222, 0.18)',
    headerBorderDark: 'rgba(191, 90, 242, 0.28)',
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
    if (!saved || saved === 'birthday' || (!isCustomized && saved === 'apple')) {
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

  // Seasonal atmosphere: 'snow' (Winter Wonderland) | 'sun' (Aussie Summer) | 'off'
  const [seasonalAtmosphere, setSeasonalAtmosphereState] = useState(() => {
    const saved = localStorage.getItem('whatgift_seasonal_atmosphere');
    if (saved && (saved === 'snow' || saved === 'sun' || saved === 'off')) {
      return saved;
    }
    return isSouthernHemisphere() ? 'sun' : 'snow';
  });

  const setSeasonalAtmosphere = (mode) => {
    setSeasonalAtmosphereState(mode);
    localStorage.setItem('whatgift_seasonal_atmosphere', mode);
  };

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
  const isChristmasTheme = activeTheme.id === 'christmas_duo' || activeTheme.id === 'christmas';
  const christmasDays = getChristmasCountdown();

  useEffect(() => {
    localStorage.setItem('whatgift_theme', themeId);

    const root = document.documentElement;
    const body = document.body;

    const currentPrimary = isDark ? (activeTheme.primaryDark || activeTheme.primary) : activeTheme.primary;
    const currentNavbarBg = isDark
      ? (activeTheme.navbarBgDark || activeTheme.primary)
      : (activeTheme.navbarBg || activeTheme.primary);

    const currentHeaderBg = isDark ? activeTheme.headerBgDark : activeTheme.headerBg;
    const currentHeaderBorder = isDark ? activeTheme.headerBorderDark : activeTheme.headerBorder;

    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', currentPrimary);
    root.style.setProperty('--theme-hover', activeTheme.hover);
    root.style.setProperty('--theme-navbar-bg', currentNavbarBg);
    root.style.setProperty('--theme-tint', activeTheme.tint);
    root.style.setProperty('--theme-tint-dark', activeTheme.tintDark || activeTheme.tint);
    root.style.setProperty('--theme-border', activeTheme.border);
    root.style.setProperty('--theme-header-bg', currentHeaderBg);
    root.style.setProperty('--theme-header-border', currentHeaderBorder);

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

    // Update browser theme-color meta tag so browser status bar matches header
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDark
          ? (activeTheme.navbarBgDarkFlat || '#18191A')
          : (activeTheme.navbarBgFlat || '#FFFFFF')
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
        seasonalAtmosphere,
        setSeasonalAtmosphere,
        isChristmasTheme,
        christmasDays,
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
