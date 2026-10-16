/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core Brand Tokens
        primary: {
          DEFAULT: '#0B1F3A', // Navy
          hover: '#08172C',
          light: '#1B3B64',
          foreground: '#FAF7F0',
        },
        accent: {
          DEFAULT: '#C9A227', // Gold
          hover: '#B5901F',
          light: '#E2BD44',
          foreground: '#0B1F3A',
        },
        navy: {
          50: '#EDF3F9',
          100: '#D5E2F1',
          200: '#ADC4E3',
          300: '#7FA1D1',
          400: '#4C7CB8',
          500: '#23579B',
          600: '#17447D',
          700: '#11335F',
          800: '#0E294C',
          900: '#0B1F3A', // Brand Primary
          950: '#06101E',
        },
        gold: {
          50: '#FAF6E8',
          100: '#F3E8C4',
          200: '#EBD89A',
          300: '#E2C76D',
          400: '#D8B744',
          500: '#C9A227', // Brand Accent
          600: '#A9831B',
          700: '#836313',
          800: '#5C440D',
          900: '#382806',
        },
        ivory: {
          DEFAULT: '#FAF7F0', // Light Background
          50: '#FFFFFF',
          100: '#FAF7F0',
          200: '#F3EFE3',
          300: '#E9E3D2',
          400: '#DDD5BE',
          500: '#CCC1A3',
        },
        charcoal: {
          DEFAULT: '#0F141B', // Dark Background
          50: '#26313E',
          100: '#202A36',
          200: '#1B232E',
          300: '#171E27',
          400: '#131921',
          500: '#0F141B',
          600: '#0C1016',
          700: '#090C11',
          800: '#06080B',
          900: '#030406',
        },
        // Semantic Legal Status Tokens
        verified: {
          DEFAULT: '#1F8A70', // Teal
          hover: '#186E59',
          light: '#E5F6F1',
          dark: '#134D3F',
          foreground: '#FFFFFF',
        },
        unverified: {
          DEFAULT: '#D98E04', // Amber (needs verification)
          hover: '#B87803',
          light: '#FEF6E6',
          dark: '#694300',
          foreground: '#FFFFFF',
        },
        alleged: {
          DEFAULT: '#C0392B', // Soft Red (error/missing/allegation)
          hover: '#A22F23',
          light: '#FDEDEB',
          dark: '#58160F',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans',
          'Noto Sans Devanagari',
          'Noto Sans Kannada',
          'Noto Sans Telugu',
          'Noto Sans Tamil',
          'Noto Sans Malayalam',
          'Noto Sans Bengali',
          'system-ui',
          'sans-serif',
        ],
        kannada: ['Noto Sans Kannada', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'sans-serif'],
        malayalam: ['Noto Sans Malayalam', 'sans-serif'],
        bengali: ['Noto Sans Bengali', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        badge: '9999px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(11, 31, 58, 0.08), 0 2px 6px -1px rgba(11, 31, 58, 0.04)',
        'soft-lg': '0 12px 36px -4px rgba(11, 31, 58, 0.12), 0 4px 12px -2px rgba(11, 31, 58, 0.06)',
        'gold-glow': '0 0 25px rgba(201, 162, 39, 0.25)',
        'navy-glow': '0 0 25px rgba(11, 31, 58, 0.25)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};
