
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B121E', // A deep, cool navy
        surface: '#151E2C',    // A slightly lighter card background
        primary: {
          DEFAULT: '#2DD4BF', // Teal
          light: '#5EEAD4',   // Lighter teal for hover/accents
        },
        warning: {
          DEFAULT: '#FBBF24', // Amber
          light: '#FCD34D',
        },
        subtle: {
          DEFAULT: '#94A3B8', // Slate 400
          dark: '#64748B',    // Slate 500
        },
        white: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
