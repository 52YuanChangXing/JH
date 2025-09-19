import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6ff',
          100: '#e6ecff',
          200: '#c3cfff',
          300: '#9dadff',
          400: '#768aff',
          500: '#4c66ff',
          600: '#2f48db',
          700: '#1f35a8',
          800: '#142275',
          900: '#0a1243'
        }
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif']
      }
    }
  },
  plugins: [tailwindAnimate]
};

export default config;
