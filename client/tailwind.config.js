/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Enable dark mode based on 'dark' class on html element
  theme: {
    extend: {
      fontFamily: {
        tajawal: ['Tajawal', 'system-ui', 'sans-serif'],
      },
      /* Light UI: sage + cream page (#F2F0E8) — replaces cyan "sky" app-wide */
      colors: {
        sky: {
          50: '#f2f0e8',
          100: '#ebe8e0',
          200: '#e5e2d8',
          300: '#cfc9bc',
          400: '#9c9688',
          500: '#7d7868',
          600: '#6B705C',
          700: '#565a49',
          800: '#3f4234',
          900: '#2f362e',
          950: '#1a1c18',
        },
        /* Second stop for gradients: deep warm neutral */
        indigo: {
          50: '#f7f6f3',
          100: '#ebe8e0',
          200: '#d6d2c6',
          300: '#b8b3a3',
          400: '#958f7c',
          500: '#7a7565',
          600: '#5c5849',
          700: '#4a463c',
          800: '#3e3b33',
          900: '#35322c',
          950: '#1c1b18',
        },
        primary: {
          DEFAULT: '#6B705C',
          dark: '#565a49',
          light: '#8f8a7a',
        },
        muted: '#6b7280',
        // CSS Variables for theme support
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
        },
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          hover: 'var(--border-hover)',
        },
        accent: {
          DEFAULT: '#6B705C',
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          hover: 'var(--accent-hover)',
        },
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        error: {
          DEFAULT: 'var(--error)',
          bg: 'var(--error-bg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          bg: 'var(--info-bg)',
        },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
};


