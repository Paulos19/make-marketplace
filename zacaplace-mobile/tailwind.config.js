/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F8F7FC',
        primary: '#7C3AED',
        'primary-light': '#EDE9FE',
        accent: '#F9A8D4',
        'accent-bg': '#FDF2F8',
        'text-dark': '#1E1B4B',
        'text-muted': '#6B7280',
        border: '#E5E7EB',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};
