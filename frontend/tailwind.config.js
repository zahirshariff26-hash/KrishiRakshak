/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#F7F3E9',
        primary: {
          50: '#f0f5f1',
          100: '#d4e4d7',
          200: '#a8c9af',
          300: '#7dae88',
          400: '#4e8f5f',
          500: '#2d6b3f',
          600: '#1F3B2C',
          700: '#1a3225',
          800: '#14271d',
          900: '#0f1c15',
        },
        accent: {
          DEFAULT: '#D98E2B',
          50: '#fdf6ea',
          100: '#fae8c4',
          200: '#f5d18a',
          300: '#efb84f',
          400: '#D98E2B',
          500: '#c47d1f',
          600: '#a86918',
          700: '#875312',
          800: '#6b410e',
          900: '#50310b',
        },
        ink: {
          DEFAULT: '#1A1A16',
          light: '#3D3D35',
          muted: '#6B6B60',
        },
      },
      fontFamily: {
        headline: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
