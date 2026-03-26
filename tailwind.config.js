/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0E3882',
          dark: '#0A2B63',
          light: '#1A4A9E',
        },
        brand: {
          blue: '#0E3882',
          light: '#5DB0EE',
          white: '#F4F7FF',
          neon: '#CDFF00',
        },
        teal: {
          DEFAULT: '#0B4E63',
          dark: '#083A4A',
          light: '#0D6080',
        },
        cyan: {
          DEFAULT: '#5DB0EE', // Map cyan to light blue for consistency
          light: '#8EF3FF',
          dim: '#3BBFD2',
          glow: 'rgba(93, 176, 238, 0.15)',
          accent: '#5DB0EE',
        },
        surface: {
          DEFAULT: '#F4F7FF',
          low: '#EBF0FF',
          high: '#FFFFFF',
          highest: '#FFFFFF',
          container: '#FFFFFF',
        },
        overlay: 'rgba(14, 56, 130, 0.05)',
        soft: '#F4F7FF',
        muted: '#64748B',
        'on-surface': '#0F172A',
        neon: '#CDFF00',
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
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
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
      },
    },
  },
  plugins: [],
}
