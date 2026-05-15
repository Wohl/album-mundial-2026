/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body:    ['var(--font-barlow)', 'sans-serif'],
      },
      colors: {
        gold:     '#C9A227',
        gold2:    '#F0C940',
        gold3:    '#FFF0A0',
        dark:     '#060A14',
        surface:  '#0A1022',
        surface2: '#0F1830',
        surface3: '#162040',
        surface4: '#1C2A52',
        electric: '#3B82F6',
        cyan:     '#06B6D4',
        plasma:   '#8B5CF6',
      },
      animation: {
        'shimmer':       'shimmer 2.5s linear infinite',
        'pop-in':        'popIn 0.2s ease-out',
        'foil-sweep':    'foilSweep 4s ease-in-out infinite',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'holo-rotate':   'holoRotate 2.5s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        popIn: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        foilSweep: {
          '0%':   { transform: 'translateX(-100%)', opacity: '0' },
          '10%':  { opacity: '1' },
          '90%':  { opacity: '1' },
          '100%': { transform: 'translateX(250%)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        holoRotate: {
          'to': { '--holo-angle': '360deg' },
        },
      },
      boxShadow: {
        'gold-sm':   '0 0 12px 2px rgba(201,162,39,0.25)',
        'gold-md':   '0 0 24px 4px rgba(240,201,64,0.30)',
        'plasma-sm': '0 0 12px 2px rgba(139,92,246,0.30)',
        'cyan-sm':   '0 0 12px 2px rgba(6,182,212,0.25)',
        'card':      '0 4px 24px rgba(0,0,0,0.5)',
        'card-glow': '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,201,64,0.1)',
      },
    },
  },
  plugins: [],
}
