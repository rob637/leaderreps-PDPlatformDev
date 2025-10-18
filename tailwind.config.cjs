/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // optional but recommended if you use `prose` classes:
    // require('@tailwindcss/typography'),
  ],
}
