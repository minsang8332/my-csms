/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--theme-primary)',
        'primary-dark': 'var(--theme-primary-dark)'
      }
    }
  },
  plugins: []
}
