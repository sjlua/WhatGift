/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: 'var(--app-radius)',
      DEFAULT: 'var(--app-radius)',
      md: 'var(--app-radius)',
      lg: 'var(--app-radius)',
      xl: 'var(--app-radius)',
      '2xl': 'var(--app-radius)',
      '3xl': 'var(--app-radius)',
      full: 'var(--app-radius)',
    },
    extend: {
      colors: {
        theme: {
          primary: 'var(--theme-primary)',
          hover: 'var(--theme-hover)',
          tint: 'var(--theme-tint)',
          border: 'var(--theme-border)',
        },
        apple: {
          blue: '#007AFF',
          red: '#FF3B30',
          green: '#34C759',
          orange: '#FF9500',
          yellow: '#FFCC00',
          gray: {
            bg: '#F2F2F7',
            card: '#FFFFFF',
            border: '#E5E5EA',
            label: '#1C1C1E',
            secondary: '#8E8E93',
            track: '#E3E3E8',
          },
        },
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-md': '0 4px 14px rgba(0, 0, 0, 0.09), 0 2px 5px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 12px 28px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.05)',
        'apple-tab': '0 2px 6px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'apple-card': '0 2px 10px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'apple-card-hover': '0 12px 24px rgba(0, 0, 0, 0.11), 0 4px 8px rgba(0, 0, 0, 0.05)',
      },
      screens: {
        'nav': '880px',
        'tablet': '840px',
      },
      fontFamily: {
        heading: [
          '"Merriweather"',
          'Georgia',
          'serif',
        ],
        body: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
