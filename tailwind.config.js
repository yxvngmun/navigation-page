/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all JS, JSX, TS, TSX files in the src directory
    "./public/index.html",       // Scans your main HTML file
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}