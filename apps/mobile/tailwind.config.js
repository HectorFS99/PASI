/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.ts',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0D2347',
        'primary-light': '#1A3A5C',
        'input-bg': '#F8FAFC',
        border: '#E2E8F0',
        muted: '#718096',
        'info-bg': '#EBF8FF',
        'info-border': '#BEE3F8',
        'info-text': '#2B6CB0',
        'success-bg': '#F0FFF4',
        'success-border': '#C6F6D5',
        'success-text': '#276749',
      },
    },
  },
  plugins: [],
};
