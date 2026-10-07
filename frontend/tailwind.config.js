/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          secondary: 'var(--brand-secondary)',
        },
        main: 'var(--bg-main)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          secondary: 'var(--bg-surface-secondary)',
        },
        border: 'var(--border-subtle)',
        content: {
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
        status: {
          error: 'var(--status-error)',
          success: 'var(--status-success)',
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'md': '6px',
        'xl': '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}
