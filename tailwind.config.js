/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2D5016',
          'green-2': '#3F7220',
          orange: '#E8610A',
          'orange-2': '#F37418',
          cream: '#F5F0E8',
          light: '#8FB573',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(45,80,22,0.04), 0 6px 20px rgba(45,80,22,0.06)',
        pop: '0 6px 16px rgba(45,80,22,0.16)',
        'pop-orange': '0 6px 16px rgba(232,97,10,0.32)',
      },
    },
  },
  plugins: [],
};
