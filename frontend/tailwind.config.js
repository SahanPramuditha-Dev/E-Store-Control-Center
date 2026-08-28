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
        brand: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          DEFAULT: 'var(--surface-card)',
          ground: 'var(--surface-ground)',
          card: 'var(--surface-card)',
          elevated: 'var(--surface-elevated)',
          sidebar: 'var(--surface-sidebar)',
          input: 'var(--surface-input)',
        },
        token: {
          text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
            muted: 'var(--text-muted)',
            disabled: 'var(--text-disabled)',
            inverse: 'var(--text-inverse)',
          },
          border: {
            DEFAULT: 'var(--border-default)',
            subtle: 'var(--border-subtle)',
            strong: 'var(--border-strong)',
            focus: 'var(--border-focus)',
          },
        },
        semantic: {
          success: {
            DEFAULT: 'var(--color-success)',
            text: 'var(--color-success-text)',
            bg: 'var(--color-success-bg)',
            border: 'var(--color-success-border)',
          },
          warning: {
            DEFAULT: 'var(--color-warning)',
            text: 'var(--color-warning-text)',
            bg: 'var(--color-warning-bg)',
            border: 'var(--color-warning-border)',
          },
          danger: {
            DEFAULT: 'var(--color-danger)',
            text: 'var(--color-danger-text)',
            bg: 'var(--color-danger-bg)',
            border: 'var(--color-danger-border)',
          },
          info: {
            DEFAULT: 'var(--color-info)',
            text: 'var(--color-info-text)',
            bg: 'var(--color-info-bg)',
            border: 'var(--color-info-border)',
          },
          ai: {
            DEFAULT: 'var(--color-ai)',
            text: 'var(--color-ai-text)',
            bg: 'var(--color-ai-bg)',
            border: 'var(--color-ai-border)',
          },
        },
      },
      boxShadow: {
        'purple-glow': '0 0 20px -3px rgba(99, 102, 241, 0.25)',
        'purple-glow-lg': '0 0 35px -5px rgba(99, 102, 241, 0.35)',
      },
    },
  },
  plugins: [],
}

