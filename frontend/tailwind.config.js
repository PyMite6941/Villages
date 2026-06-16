/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        village: {
          50: '#fdf8f0',
          100: '#faecd6',
          200: '#f4d5a8',
          300: '#ecb872',
          400: '#e3953e',
          500: '#d97a20',
          600: '#ca6118',
          700: '#a74916',
          800: '#863c18',
          900: '#6d3317',
          950: '#3b1909',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
