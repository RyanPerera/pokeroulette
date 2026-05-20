/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Primary: Pokemon Emerald web font
        pixel: ['"Pokemon Emerald"', '"Press Start 2P"', 'monospace'],
      },
      colors: {
        poke: {
          red: '#CC0000',
          darkred: '#880000',
          screen: '#9BBC0F',
          screenDark: '#0F380F',
          screenMid: '#306230',
          frame: '#1a1a2e',
          panel: '#16213e',
          border: '#e63946',
          gold: '#FFD700',
        },
      },
      keyframes: {
        glow: {
          '0%,100%': { boxShadow: '0 0 8px #9BBC0F,0 0 16px #9BBC0F40' },
          '50%': { boxShadow: '0 0 20px #9BBC0F,0 0 40px #9BBC0F80' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
        bounceIn: 'bounceIn 0.5s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
