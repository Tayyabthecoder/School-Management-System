/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#6366F1',
          600: '#4F46E5', // Primary Electric Indigo
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5', // Primary
          700: '#4338CA',
          800: '#3730A3', // Primary Dark
        },
        teal: {
          600: '#0D9488', // Secondary
          700: '#0F766E',
        },
        green: {
          600: '#16A34A', // Success
        },
        amber: {
          600: '#D97706', // Warning
        },
        red: {
          600: '#DC2626', // Danger
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        soft: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        float: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px -5px rgba(79, 70, 229, 0.25)',
      },
    },
  },
  plugins: [],
}
