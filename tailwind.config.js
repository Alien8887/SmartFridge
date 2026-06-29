module.exports = {
  darkMode: 'class',
  content:  ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        slideDown:   { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp:     { '0%': { opacity: '0', transform: 'translateY(10px)' },  '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:      { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn:     { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'glow-pulse':  { '0%, 100%': { boxShadow: '0 0 0 0 rgba(14,165,233,0)' }, '50%': { boxShadow: '0 0 0 6px rgba(14,165,233,0.15)' } },
        'number-pop':  { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.12)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'slide-down': 'slideDown 0.25s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'number-pop': 'number-pop 0.35s ease-out',
      },
    },
  },
  plugins: [],
};