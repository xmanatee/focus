/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1F1B17',
        'surface-raised': '#2A2521',
        'surface-sunken': '#16130F',
        ink: '#F4EEE3',
        'ink-muted': '#A8A095',
        'ink-faint': '#635B52',
        signal: '#E8884A',
        'signal-soft': '#C57B4C',
        divider: '#3A342D',
        danger: '#D94B2F',
      },
      fontFamily: {
        display: ['System'],
        body: ['System'],
      },
    },
  },
  plugins: [],
};
