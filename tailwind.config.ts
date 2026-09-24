import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Ink — the primary brand/action color. A deep, slightly desaturated
        // navy rather than a generic SaaS blue.
        primary: {
          50: '#EEF1F6',
          100: '#DCE2EC',
          200: '#B6C2D6',
          300: '#8FA1C0',
          400: '#5D74A0',
          500: '#3E5480',
          600: '#2C4064',
          700: '#24344D',
          800: '#1C283D',
          900: '#151E2E',
          950: '#0D131D',
        },
        // Merit — a muted brass/gold accent, used sparingly (badges,
        // highlights, a few meaningful indicators) rather than everywhere.
        accent: {
          50: '#FBF6EB',
          100: '#F4E9CC',
          200: '#E9D19E',
          300: '#DCB86F',
          400: '#CBA04E',
          500: '#B8863E',
          600: '#9C6E30',
          700: '#7D5726',
          800: '#5F421D',
          900: '#412D14',
        },
        paper: {
          DEFAULT: '#F6F4EF',
          dark: '#15181C',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
