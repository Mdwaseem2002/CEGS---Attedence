/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',       // Pages in app directory
    './src/pages/**/*.{js,ts,jsx,tsx}',     // If you use pages dir
    './src/components/**/*.{js,ts,jsx,tsx}', // Components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
