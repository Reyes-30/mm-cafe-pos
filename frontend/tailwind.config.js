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
        cafe: {
          50: '#fdf8f6',
          100: '#f9ede6',
          200: '#f3d9c8',
          300: '#e8b89a',
          400: '#d4896a',
          500: '#c06a47',
          600: '#a5513a',
          700: '#6B3A2A',
          800: '#5a3125',
          900: '#4a2920',
        },
        cream: {
          50: '#FFFDF9',
          100: '#FAF5EE',
          200: '#F5EDE0',
          300: '#EDE0CC',
          400: '#E0CDB0',
        },
        gold: {
          50: '#fdf8ef',
          100: '#f9edcf',
          200: '#f2d79e',
          300: '#e8bc66',
          400: '#C8973A',
          500: '#b87d24',
          600: '#a3621c',
          700: '#87491a',
          800: '#6f3a1c',
          900: '#5c311b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
}
