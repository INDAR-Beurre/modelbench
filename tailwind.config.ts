import type { Config } from 'tailwindcss';

const config: Config = {
  // Light "paper" theme only — no dark mode.
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        // Editorial Register palette
        ink: '#120f0a',
        'ink-2': '#17130f',
        'muted-ink': '#5e5548',
        paper: '#fff7e6',
        'paper-2': '#ffedbc',
        'paper-3': '#ffd7bd',
        cream: '#ffeec5',
        'cream-2': '#fff3d2',
        brand: {
          red: '#ff4d2e',
          blue: '#1d4dff',
          violet: '#7b3dff',
          lime: '#d8ff38',
          rose: '#ff8ab3',
        },
        // shadcn aliases so existing className strings keep working
        border: '#120f0a',
        input: '#120f0a',
        ring: '#7b3dff',
        background: '#fff7e6',
        foreground: '#120f0a',
        primary: { DEFAULT: '#120f0a', foreground: '#fff7e6' },
        secondary: { DEFAULT: '#ffeec5', foreground: '#120f0a' },
        destructive: { DEFAULT: '#ff4d2e', foreground: '#fff7e6' },
        muted: { DEFAULT: '#5e5548', foreground: '#120f0a' },
        accent: { DEFAULT: '#d8ff38', foreground: '#120f0a' },
        popover: { DEFAULT: '#fff7e6', foreground: '#120f0a' },
        card: { DEFAULT: '#fff7e6', foreground: '#120f0a' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
        eyebrow: '0.22em',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
        pill: '999px',
      },
      boxShadow: {
        paper: '0 1px 0 0 rgba(18,15,10,0.08), 0 20px 40px -20px rgba(18,15,10,0.18)',
        'paper-2': '0 1px 0 0 rgba(18,15,10,0.10), 0 30px 60px -28px rgba(18,15,10,0.22)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.5)',
        bezel: '0 0 0 1px rgba(18,15,10,1), 0 24px 48px -24px rgba(18,15,10,0.35)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'underline-sweep': {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.32, 0.72, 0, 1) both',
        'underline-sweep': 'underline-sweep 0.5s cubic-bezier(0.32, 0.72, 0, 1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
