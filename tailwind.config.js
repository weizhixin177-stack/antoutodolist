/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#f7f5f0',
          deep: '#efece4',
        },
        ink: {
          DEFAULT: '#26231d',
          soft: '#57524a',
          faint: '#8a8478',
        },
        pine: {
          50: '#eef5f0',
          100: '#d6e7db',
          500: '#3a7355',
          600: '#2f6b52',
          700: '#265542',
        },
        cinnabar: {
          50: '#fdeeec',
          100: '#fbd9d4',
          500: '#cf4a37',
          600: '#bd3f2e',
        },
        amber2: {
          50: '#fbf3e2',
          100: '#f5e3ba',
          500: '#c08a26',
          600: '#a8741d',
        },
      },
      fontFamily: {
        serifcn: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sanscn: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(38,35,29,0.05), 0 4px 16px rgba(38,35,29,0.06)',
        lift: '0 8px 28px rgba(38,35,29,0.16)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.01)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
