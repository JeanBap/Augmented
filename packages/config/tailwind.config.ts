import type { Config } from 'tailwindcss'

// Shared Tailwind config used by all 3 apps
// Each app extends this in their own tailwind.config.ts:
//   import sharedConfig from '@raiseready/config/tailwind.config'
//   export default { ...sharedConfig, content: ['./app/**/*.tsx', ...] }

const config: Config = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Raise Ready brand colors (from raisereadybook.com)
        brand: {
          gold: '#C9A85A',
          'gold-light': '#D4BA7A',
          navy: '#1A2B4A',
          'navy-light': '#2A3B5A',
          cream: '#F5F3EF',
          'cream-dark': '#E8E4DC',
        },
        // shadcn CSS variable colors (keep from calculateapr)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}

export default config
