/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: '#002E47',
        teal: '#47A88D',
        orange: '#E04E1B',
        cream: '#FFFAF8',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.06)',
        pop: '0 10px 30px rgba(0,46,71,0.12)',
      },
    },
  },
  plugins: [],
};
