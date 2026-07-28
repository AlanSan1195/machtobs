/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans Variable"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        display: ['"Archivo Variable"', '"Arial Black"', 'sans-serif'],
      },
      colors: {
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-hover': 'rgb(var(--surface-hover-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        // primary accent — single source: --accent-rgb in index.css
        primary: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'primary-dim': 'rgb(var(--accent-dim-rgb) / <alpha-value>)',
        'primary-hover': 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
        obs: 'rgb(var(--obs-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
        glow: 'rgb(var(--accent-rgb) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        text: '#f1efe8',
        'text-muted': '#b8b8b0',
        'text-faint': '#76796d',
      },
      letterSpacing: {
        terminal: '0.08em',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.985' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        blink: 'blink 1.1s step-end infinite',
        'pulse-dot': 'pulseDot 1.8s ease-in-out infinite',
        scan: 'scan 7s linear infinite',
        flicker: 'flicker 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
