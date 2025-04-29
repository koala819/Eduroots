import type {Config} from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import {fontFamily} from 'tailwindcss/defaultTheme'

const config = {
  darkMode: ['class'],
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './app/unauthorized/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        or: {
          DEFAULT: '#D4AF37',
          clair: '#F4C430',
          fonce: '#996515',
          brillant: '#FEF200',
        },
        argent: {
          DEFAULT: '#C0C0C0',
          clair: '#E8E8E8',
          fonce: '#A9A9A9',
          brillant: '#F8F8FF',
        },
        bronze: {
          DEFAULT: '#CD7F32',
          clair: '#DEB887',
          fonce: '#8B4513',
          rougeâtre: '#B87333',
        },
        inferno: {
          light: '#FFD700', // Jaune doré
          DEFAULT: '#FF4500', // Rouge-orangé
          dark: '#8B0000', // Rouge foncé
        },
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
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      backgroundImage: {
        'effet-metal-or': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'effet-metal-argent': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'effet-metal-bronze': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'effet-inferno': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {height: '0'},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: '0'},
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
      },
    },
  },
  safelist: [
    {
      pattern: /bg-(red|blue|green|yellow)-(100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus', 'active'],
    },
    {
      pattern: /from-(red|blue|green|yellow)-(100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus', 'active'],
    },
    {
      pattern: /to-(red|blue|green|yellow)-(100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus', 'active'],
    },
    {
      pattern: /bg-gradient-to-(r|l|t|b)/,
    },
    'bg-red-600',
    'bg-orange-600',
    'bg-green-700',
    'bg-blue-400',
    'bg-pink-500',
    'bg-gray-500',
    // Theme_TEACHER_blue
    'from-sky-400',
    'border-sky-400',
    'text-sky-700',
    'hover:bg-sky-50',
    'border-indigo-400',
    'text-indigo-700',
    'hover:bg-indigo-50',
    'hover:text-indigo-800',
    'to-emerald-400',
    'to-indigo-900',
    'bg-sky-500',
    'hover:bg-sky-600',
    'to-cyan-300',
    // Or
    'bg-effet-metal-or',
    'from-or-clair',
    'via-or',
    'to-or-fonce',
    'text-amber-900',
    // Argent
    'bg-effet-metal-argent',
    'from-argent-clair',
    'via-argent',
    'to-argent-fonce',
    'text-slate-900',
    // Bronze
    'bg-effet-metal-bronze',
    'from-bronze-clair',
    'via-bronze',
    'to-bronze-fonce',
    'text-orange-50',
    // Inferno effect
    'bg-effet-inferno',
    'from-inferno-light',
    'via-inferno',
    'to-inferno-dark',
    'text-white',
  ],
  plugins: [animatePlugin],
} satisfies Config

export default config
