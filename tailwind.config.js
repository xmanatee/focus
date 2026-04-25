/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--surface-raised) / <alpha-value>)',
        'surface-sunken': 'rgb(var(--surface-sunken) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        signal: 'rgb(var(--signal) / <alpha-value>)',
        divider: 'rgb(var(--divider) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      spacing: {
        screen: '16px',
        card: '16px',
      },
      borderRadius: {
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      fontFamily: {
        display: ['System'],
        body: ['System'],
      },
    },
  },
  plugins: [],
};
