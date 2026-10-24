import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function SeasonalAtmosphere() {
  const { isChristmasTheme, seasonalAtmosphere, isDark } = useTheme();

  // Only render if a Christmas theme is active and atmosphere is not 'off'
  if (!isChristmasTheme || seasonalAtmosphere === 'off') {
    return null;
  }

  return seasonalAtmosphere === 'sun' ? (
    <AussieSummerAtmosphere isDark={isDark} />
  ) : (
    <WinterSnowAtmosphere isDark={isDark} />
  );
}

function WinterSnowAtmosphere({ isDark }) {
  // Pre-generate 22 deterministic snowflakes with varying drift, delay, size, and positions
  const snowflakes = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => {
      const left = ((i * 17.3 + 5) % 95).toFixed(1);
      const delay = ((i * 0.73) % 8).toFixed(2);
      const duration = (6 + ((i * 1.37) % 7)).toFixed(2);
      const size = (6 + ((i * 3.1) % 8)).toFixed(1);
      const drift = (-25 + ((i * 13.7) % 50)).toFixed(0);
      const opacity = isDark
        ? (0.25 + ((i * 0.05) % 0.35)).toFixed(2)
        : (0.35 + ((i * 0.05) % 0.4)).toFixed(2);

      return {
        id: i,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        fontSize: `${size}px`,
        opacity,
        drift: `${drift}px`,
      };
    });
  }, [isDark]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {snowflakes.map((flake) => (
        <span
          key={flake.id}
          className="absolute top-0 text-white will-change-transform animate-snowfall"
          style={{
            left: flake.left,
            fontSize: flake.fontSize,
            opacity: flake.opacity,
            animationDelay: flake.animationDelay,
            animationDuration: flake.animationDuration,
            '--snow-drift': flake.drift,
            textShadow: isDark
              ? '0 0 6px rgba(255, 255, 255, 0.4)'
              : '0 0 5px rgba(0, 0, 0, 0.15)',
          }}
        >
          ❄
        </span>
      ))}
    </div>
  );
}

function AussieSummerAtmosphere({ isDark }) {
  // Pre-generate 16 warm floating golden motes/sparkles without any background gradient glow
  const sunMotes = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const left = ((i * 19.1 + 8) % 94).toFixed(1);
      const delay = ((i * 0.91) % 9).toFixed(2);
      const duration = (7 + ((i * 1.45) % 8)).toFixed(2);
      const size = (3 + ((i * 2.1) % 5)).toFixed(1);
      const drift = (-20 + ((i * 11.3) % 40)).toFixed(0);

      return {
        id: i,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        width: `${size}px`,
        height: `${size}px`,
        drift: `${drift}px`,
      };
    });
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Floating Golden Summer Sparkles / Motes (Clean, no background gradient glow) */}
      {sunMotes.map((mote) => (
        <span
          key={mote.id}
          className="absolute bottom-0 rounded-full bg-amber-400 dark:bg-amber-300 will-change-transform animate-sun-mote shadow-sm"
          style={{
            left: mote.left,
            width: mote.width,
            height: mote.height,
            animationDelay: mote.animationDelay,
            animationDuration: mote.animationDuration,
            '--mote-drift': mote.drift,
            boxShadow: '0 0 6px rgba(255, 193, 7, 0.8)',
          }}
        />
      ))}
    </div>
  );
}
