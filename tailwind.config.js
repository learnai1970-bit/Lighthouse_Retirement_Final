/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          850: "#172033",
          950: "#0b1120",
        }
      }
    },
  },
  plugins: [],
}
