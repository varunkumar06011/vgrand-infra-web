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
        // Earth palette — sampled from the meadow reference photo.
        forest: { DEFAULT: '#14301c', 800: '#1b3f27', 700: '#24512f' },
        meadow: { DEFAULT: '#4a8a2a', 400: '#6aa83e', 500: '#4a8a2a', 600: '#3b7122', 700: '#2f5d1e' },
        sky: { DEFAULT: '#2f6fdc', 50: '#eef4fb', 100: '#dce9f6', 200: '#bcd4ee', 500: '#2f6fdc', 600: '#2459b8' },
        cream: { DEFAULT: '#f6f3e8', 100: '#faf8f1', 200: '#efe9d6' },
        petal: '#fbf7ee',
        bark: '#5b4a35',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        organic: '2rem 0.75rem 2rem 0.75rem',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(20,48,28,0.18)',
        lift: '0 24px 60px -20px rgba(20,48,28,0.35)',
      },
    },
  },
  plugins: [],
}
