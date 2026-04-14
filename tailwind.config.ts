import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: rgb('--bg'),
        surface: rgb('--surface'),
        'surface-2': rgb('--surface-2'),
        'surface-3': rgb('--surface-3'),
        border: rgb('--border'),
        'border-strong': rgb('--border-strong'),
        fg: rgb('--fg'),
        'fg-soft': rgb('--fg-soft'),
        'fg-muted': rgb('--fg-muted'),
        'fg-subtle': rgb('--fg-subtle'),
        gold: rgb('--gold'),
        'gold-soft': rgb('--gold-soft'),
        'gold-deep': rgb('--gold-deep'),
        danger: rgb('--danger'),
        success: rgb('--success'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-serif)', 'Times New Roman', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
        'pulse-dot': { '0%,100%': { opacity: '0.35' }, '50%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.2,0.7,0.2,1) both',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [animate],
};
export default config;
