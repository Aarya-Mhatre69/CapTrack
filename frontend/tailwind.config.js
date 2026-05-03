/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#05050a',
          900: '#0d0d14',
          800: '#13131d',
          700: '#1a1a28',
          600: '#22223a',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f52d4',
          muted: 'rgba(99,102,241,0.15)',
          border: 'rgba(99,102,241,0.3)',
        },
      },
      opacity: {
        '6':  '0.06',
        '8':  '0.08',
        '12': '0.12',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow': '0 0 20px rgba(99,102,241,0.25)',
        'glow-sm': '0 0 10px rgba(99,102,241,0.2)',
      },
    },
  },
  plugins: [],
};
