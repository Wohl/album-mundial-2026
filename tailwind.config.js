/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-barlow)', 'sans-serif'],
      },
      colors: {
        gold: '#C9A227',
        gold2: '#F0C940',
        dark: '#090D1A',
        surface: '#0F1625',
        surface2: '#161E30',
        surface3: '#1C2640',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pop-in': 'popIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
