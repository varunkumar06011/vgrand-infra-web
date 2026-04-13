/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#f97316',
          600: '#ea6a0f',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Montserrat', 'sans-serif'],
        body: ['var(--font-body)', 'Open Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
