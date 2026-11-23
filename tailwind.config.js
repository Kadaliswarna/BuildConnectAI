/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#08265B', 900: '#041738', 800: '#08265B', 700: '#0f3884' },
        brand: { DEFAULT: '#1554C8', dark: '#1043a3', light: '#2563eb' },
        accent: { DEFAULT: '#FF7900', dark: '#e06b00', light: '#ff8f26' },
        ink: '#081a3a',
        paper: '#F4F7FC',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', '"Poppins"', '"Noto Sans Telugu"', '"Noto Sans Devanagari"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
