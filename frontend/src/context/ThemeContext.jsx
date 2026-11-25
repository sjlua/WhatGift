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
    primary: '#AE2E24',
    primaryDark: '#F17870',
    action: '#AE2E24',
    secondary: '#4C6B1F',
    secondaryDark: '#94C748',
    hover: '#8E251E',
    navbarBg: '#AE2E24',
    navbarBgDark: '#3A110E',
    navbarBgFlat: '#AE2E24',
    navbarBgDarkFlat: '#3A110E',
    headerBg: 'rgba(174, 46, 36, 0.08)',
    headerBgDark: 'rgba(241, 120, 112, 0.14)',
    headerBorder: 'rgba(174, 46, 36, 0.18)',
    headerBorderDark: 'rgba(241, 120, 112, 0.24)',
    tint: 'rgba(174, 46, 36, 0.12)',
    tintDark: 'rgba(241, 120, 112, 0.18)',
    border: 'rgba(174, 46, 36, 0.32)',
    swatch: '#AE2E24',
    swatches: ['#AE2E24', '#4C6B1F'],
  },
  {
    id: 'lime_green',
    name: 'Lime Green',
    holiday: 'Green',
    isEvent: false,
    primary: '#5B7D26',
    primaryDark: '#94C748',
    action: '#5B7D26',
    hover: '#49651F',
    navbarBg: '#5B7D26',
    navbarBgDark: '#1E2C0C',
    navbarBgFlat: '#5B7D26',
    navbarBgDarkFlat: '#1E2C0C',
    headerBg: 'rgba(148, 199, 72, 0.08)',
    headerBgDark: 'rgba(148, 199, 72, 0.14)',
    headerBorder: 'rgba(148, 199, 72, 0.18)',
    headerBorderDark: 'rgba(148, 199, 72, 0.24)',
    tint: 'rgba(148, 199, 72, 0.12)',
    tintDark: 'rgba(148, 199, 72, 0.18)',
    border: 'rgba(148, 199, 72, 0.32)',
    swatch: '#94C748',
    swatches: ['#94C748'],
  },
  {
    id: 'diamond_blue',
    name: 'Diamond Blue',
    holiday: 'Blue',
    isEvent: false,
    primary: '#176E8A',
    primaryDark: '#2898BD',
    action: '#176E8A',
    hover: '#125A72',
    navbarBg: '#176E8A',
    navbarBgDark: '#0B2832',
    navbarBgFlat: '#176E8A',
    navbarBgDarkFlat: '#0B2832',
    headerBg: 'rgba(40, 152, 189, 0.08)',
    headerBgDark: 'rgba(40, 152, 189, 0.14)',
    headerBorder: 'rgba(40, 152, 189, 0.18)',
    headerBorderDark: 'rgba(40, 152, 189, 0.24)',
    tint: 'rgba(40, 152, 189, 0.12)',
    tintDark: 'rgba(40, 152, 189, 0.18)',
    border: 'rgba(40, 152, 189, 0.32)',
    swatch: '#2898BD',
    swatches: ['#2898BD'],
  },
  {
    id: 'ruby_red',
    name: 'Ruby Red',
    holiday: 'Red',
    isEvent: false,
    primary: '#C9372C',
    primaryDark: '#F26D62',
    action: '#C9372C',
    hover: '#A52B23',
    navbarBg: '#C9372C',
    navbarBgDark: '#3C100D',
    navbarBgFlat: '#C9372C',
    navbarBgDarkFlat: '#3C100D',
    headerBg: 'rgba(201, 55, 44, 0.08)',
    headerBgDark: 'rgba(242, 109, 98, 0.14)',
    headerBorder: 'rgba(201, 55, 44, 0.18)',
    headerBorderDark: 'rgba(242, 109, 98, 0.24)',
    tint: 'rgba(201, 55, 44, 0.12)',
    tintDark: 'rgba(242, 109, 98, 0.18)',
    border: 'rgba(201, 55, 44, 0.32)',
    swatch: '#C9372C',
    swatches: ['#C9372C'],
  },
  {
    id: 'lilac_purple',
    name: 'Lilac Purple',
    holiday: 'Purple',
    isEvent: false,
    primary: '#8436AA',
    primaryDark: '#BA6FE5',
    action: '#8436AA',
    hover: '#6A2B89',
    navbarBg: '#8436AA',
    navbarBgDark: '#2D143A',
    navbarBgFlat: '#8436AA',
    navbarBgDarkFlat: '#2D143A',
    headerBg: 'rgba(175, 89, 225, 0.08)',
    headerBgDark: 'rgba(186, 111, 229, 0.14)',
    headerBorder: 'rgba(175, 89, 225, 0.18)',
    headerBorderDark: 'rgba(186, 111, 229, 0.24)',
    tint: 'rgba(175, 89, 225, 0.12)',
    tintDark: 'rgba(186, 111, 229, 0.18)',
    border: 'rgba(175, 89, 225, 0.32)',
    swatch: '#AF59E1',
    swatches: ['#AF59E1'],
  },
  {
    id: 'grand_gold',
    name: 'Grand Gold',
    holiday: 'Gold',
    isEvent: false,
    primary: '#8B5900',
    primaryDark: '#FCA700',
    action: '#8B5900',
    hover: '#714800',
    navbarBg: '#8B5900',
    navbarBgDark: '#2F2105',
    navbarBgFlat: '#8B5900',
    navbarBgDarkFlat: '#2F2105',
    headerBg: 'rgba(252, 167, 0, 0.08)',
    headerBgDark: 'rgba(252, 167, 0, 0.14)',
    headerBorder: 'rgba(252, 167, 0, 0.18)',
    headerBorderDark: 'rgba(252, 167, 0, 0.24)',
    tint: 'rgba(252, 167, 0, 0.12)',
    tintDark: 'rgba(252, 167, 0, 0.18)',
    border: 'rgba(252, 167, 0, 0.32)',
    swatch: '#FCA700',
    swatches: ['#FCA700'],
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem('whatgift_theme');
    return THEMES.some((theme) => theme.id === saved) ? saved : 'christmas_duo';
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
    root.style.setProperty('--theme-action', activeTheme.action || currentPrimary);
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
      root.style.backgroundColor = '#111113';
      if (body) body.style.backgroundColor = '#111113';
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
