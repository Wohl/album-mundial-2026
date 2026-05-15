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
        // Paleta principal — Copa del Mundo premium
        gold:     '#F5C542',   // dorado premium
        gold2:    '#FFD700',   // dorado puro
        gold3:    '#FFF5CC',   // crema dorado
        dark:     '#081120',   // azul noche profundo
        surface:  '#0F172A',   // navy
        surface2: '#132030',   // navy claro
        surface3: '#1A2840',   // azul medio
        surface4: '#213255',   // azul suave
        verde:    '#0E5A36',   // verde césped oscuro
        humo:     '#F3F4F6',   // blanco humo
        // Acentos holográficos — solo rarezas especiales
        holoCyan:    '#38BDF8',
        holoMagenta: '#D946EF',
        holoLima:    '#84CC16',
        // Aliases de compatibilidad
        electric: '#3B82F6',
        cyan:     '#38BDF8',
        plasma:   '#D946EF',
      },
      animation: {
        'shimmer':        'shimmer 2.5s linear infinite',
        'pop-in':         'popIn 0.2s ease-out',
        'foil-sweep':     'foilSweep 4s ease-in-out infinite',
        'pulse-glow':     'pulseGlow 2s ease-in-out infinite',
        'holo-rotate':    'holoRotate 2.5s linear infinite',
        'pack-shake':     'packShake 0.7s cubic-bezier(0.36,0.07,0.19,0.97)',
        'pack-rip':       'packRip 0.5s ease-out forwards',
        'card-flip-in':   'cardFlipIn 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'particle-rise':  'particleRise 1.2s ease-out forwards',
        'glow-pulse':     'glowPulse 1.8s ease-in-out infinite',
        'slide-up':       'slideUp 0.4s ease-out forwards',
        'float':          'float 3s ease-in-out infinite',
        'badge-pop':      'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'broadcast-in':   'broadcastIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
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
        packShake: {
          '0%':   { transform: 'translateX(0) rotate(0deg)' },
          '15%':  { transform: 'translateX(-6px) rotate(-2deg)' },
          '30%':  { transform: 'translateX(6px) rotate(2deg)' },
          '45%':  { transform: 'translateX(-4px) rotate(-1.5deg)' },
          '60%':  { transform: 'translateX(4px) rotate(1.5deg)' },
          '75%':  { transform: 'translateX(-2px) rotate(-1deg)' },
          '90%':  { transform: 'translateX(2px) rotate(1deg)' },
          '100%': { transform: 'translateX(0) rotate(0deg)' },
        },
        packRip: {
          '0%':   { transform: 'scaleY(1)', opacity: '1' },
          '50%':  { transform: 'scaleY(1.1) scaleX(1.05)', opacity: '0.7' },
          '100%': { transform: 'scaleY(0) scaleX(1.2)', opacity: '0' },
        },
        cardFlipIn: {
          '0%':   { transform: 'perspective(800px) rotateY(90deg) scale(0.7)', opacity: '0' },
          '100%': { transform: 'perspective(800px) rotateY(0deg) scale(1)',    opacity: '1' },
        },
        particleRise: {
          '0%':   { transform: 'translateY(0) scale(1) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-120px) scale(0) rotate(180deg)', opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245,197,66,0.35)' },
          '50%':      { boxShadow: '0 0 50px rgba(245,197,66,0.7), 0 0 100px rgba(245,197,66,0.2)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        badgePop: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '70%':  { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        broadcastIn: {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
      },
      boxShadow: {
        'gold-sm':   '0 0 12px 2px rgba(245,197,66,0.30)',
        'gold-md':   '0 0 28px 6px rgba(255,215,0,0.35)',
        'gold-lg':   '0 0 50px 12px rgba(255,215,0,0.22)',
        'plasma-sm': '0 0 14px 3px rgba(217,70,239,0.35)',
        'cyan-sm':   '0 0 14px 3px rgba(56,189,248,0.30)',
        'verde-sm':  '0 0 12px 2px rgba(14,90,54,0.50)',
        'card':      '0 6px 32px rgba(0,0,0,0.65)',
        'card-glow': '0 6px 32px rgba(0,0,0,0.65), 0 0 0 1px rgba(245,197,66,0.14)',
        'premium':   '0 10px 40px rgba(0,0,0,0.75), 0 0 0 1px rgba(245,197,66,0.18)',
        'broadcast': '0 4px 30px rgba(0,0,0,0.8), 0 0 60px rgba(8,17,32,0.5)',
      },
    },
  },
  plugins: [],
}
