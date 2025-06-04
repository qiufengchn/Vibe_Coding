/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'note-gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            hr: {
              borderColor: '#e5e7eb',
              marginTop: '2em',
              marginBottom: '2em',
            },
            'h1, h2, h3, h4, h5, h6': {
              color: '#111827',
            },
            blockquote: {
              borderLeftColor: '#3b82f6',
            },
            code: {
              color: '#dc2626',
              backgroundColor: '#f3f4f6',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              borderRadius: '0.25rem',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
        dark: {
          css: {
            color: '#d1d5db',
            'h1, h2, h3, h4, h5, h6': {
              color: '#f9fafb',
            },
            blockquote: {
              borderLeftColor: '#60a5fa',
              color: '#d1d5db',
            },
            code: {
              color: '#fca5a5',
              backgroundColor: '#374151',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
} 