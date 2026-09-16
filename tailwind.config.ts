import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec2ff',
          400: '#599fff',
          500: '#3277ff',
          600: '#1c56f5',
          700: '#1642e0',
          800: '#1936b5',
          900: '#1a338f',
          950: '#141f57',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
