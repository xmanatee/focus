/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text: '#111827',
        textMuted: '#6B7280',
      },
    },
  },
  plugins: [],
};
