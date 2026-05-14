/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#14532d',
        leaf: '#16a34a',
        mint: '#dcfce7',
        cream: '#f8fff8',
        ink: '#18231d'
      },
      boxShadow: {
        soft: '0 20px 50px -30px rgba(20, 83, 45, 0.35)'
      }
    }
  },
  plugins: []
}
