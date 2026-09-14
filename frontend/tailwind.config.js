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
        surface: {
          DEFAULT: '#ffffff',
          warm: '#f8faf8',
        },
        primary: {
          50: '#ecfdf5',
          100: '#d0fae5',
          200: '#a4f4cf',
          300: '#5ee9b5',
          400: '#3ba946',
          500: '#2E7D32',
          600: '#1B5E20',
          700: '#145218',
          800: '#0d3a11',
          900: '#002c22',
        },
        accent: {
          DEFAULT: '#3ba946',
          50: '#ecfdf5',
          100: '#d0fae5',
          200: '#a4f4cf',
          300: '#5ee9b5',
          400: '#3ba946',
          500: '#2E7D32',
          600: '#1B5E20',
          700: '#145218',
          800: '#0d3a11',
          900: '#002c22',
        },
        ink: {
          DEFAULT: '#004514',
          light: '#1a5c2e',
          muted: '#546a56',
        },
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 69, 20, 0.08), 0 1px 4px -1px rgba(0, 69, 20, 0.04)',
        'soft-md': '0 4px 12px -3px rgba(0, 69, 20, 0.1), 0 2px 6px -2px rgba(0, 69, 20, 0.05)',
        'soft-lg': '0 8px 24px -4px rgba(0, 69, 20, 0.12), 0 4px 12px -3px rgba(0, 69, 20, 0.06)',
        'glow': '0 0 20px rgba(59, 169, 70, 0.15)',
      },
    },
  },
  plugins: [],
};
