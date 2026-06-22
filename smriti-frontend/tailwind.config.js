/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Clash Display', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        background: '#050505', // Ethereal Glass Deepest OLED black
        surface: '#111216',
        surface2: '#1C1D22',
        border: 'rgba(255, 255, 255, 0.07)',
        borderHover: 'rgba(255, 255, 255, 0.14)',
        accent: '#4F8EF7',
        accentGlow: 'rgba(79, 142, 247, 0.25)',
        critical: '#F74F4F',
        warning: '#F7A84F',
        ok: '#4FF7A0',
        textPrimary: '#F1F3F9',
        textSecondary: '#8B95B0',
        textMuted: '#4A5270',
      },
      transitionTimingFunction: {
        'haptic': 'cubic-bezier(0.32,0.72,0,1)', // Custom bezier for natural physics
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring-like feel
      },
      boxShadow: {
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.15)', // Inner core highlight
        'glow-accent': '0 0 20px rgba(79, 142, 247, 0.25)',
        'glow-critical': '0 0 20px rgba(247, 79, 79, 0.3)',
      },
      borderRadius: {
        'squircle': '2rem',
        'squircle-inner': 'calc(2rem - 0.375rem)',
      }
    },
  },
  plugins: [],
}
