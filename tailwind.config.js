/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: 'var(--color-navy)',
          dark: 'var(--color-navy-dark)',
          light: 'var(--color-navy-light)',
        },
        brand: {
          blue: 'var(--color-navy)',
          light: 'var(--color-cyan-light)',
          white: 'var(--color-surface)',
          neon: '#0070E0',
        },
        teal: {
          DEFAULT: 'var(--color-teal)',
          dark: 'var(--color-teal-dark)',
          light: 'var(--color-teal-light)',
        },
        cyan: {
          DEFAULT: 'var(--color-cyan)',
          light: 'var(--color-cyan-light)',
          dim: 'var(--color-cyan-dim)',
          glow: 'var(--color-shadow-glow)',
          accent: 'var(--color-cyan)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          low: 'var(--color-surface-low)',
          high: 'var(--color-surface-high)',
          highest: 'var(--color-surface-highest)',
          container: 'var(--color-surface-container',
        },
        overlay: 'var(--color-overlay)',
        soft: 'var(--color-soft)',
        muted: 'var(--color-muted)',
        'on-surface': 'var(--color-on-surface)',
        neon: '#0070E0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(87, 214, 232, 0.2)',
        'glow-lg': '0 0 60px rgba(87, 214, 232, 0.25)',
        'glow-sm': '0 0 15px rgba(87, 214, 232, 0.2)',
        'card': '0 24px 80px rgba(4, 30, 43, 0.4)',
        'ambient': '0 20px 40px rgba(6, 43, 61, 0.6)',
      },
      backdropBlur: {
        xs: '4px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyan-gradient': 'linear-gradient(135deg, #57D6E8, #3BBFD2)',
        'dark-gradient': 'linear-gradient(180deg, #062B3D 0%, #041E2B 100%)',
        'hero-mesh': 'radial-gradient(ellipse at 70% 50%, rgba(87,214,232,0.08) 0%, transparent 60%)',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(87, 214, 232, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(87, 214, 232, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
