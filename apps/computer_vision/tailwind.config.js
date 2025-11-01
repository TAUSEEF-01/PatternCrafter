/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'ls-primary': '#4A6CF7',
        'ls-secondary': '#1F2937'
      }
    }
  },
  plugins: []
};
