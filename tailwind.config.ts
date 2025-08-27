import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px'
			}
		},
		fontFamily: {
			sans: ['Geist', 'system-ui', 'sans-serif'],
			mono: ['Geist Mono', 'monospace'],
		},
		spacing: {
			'0': '0px',
			'0.5': '2px',
			'1': '4px',
			'1.5': '6px',
			'2': '8px',
			'2.5': '10px',
			'3': '12px',
			'3.5': '14px',
			'4': '16px',
			'5': '20px',
			'6': '24px',
			'7': '28px',
			'8': '32px',
			'9': '36px',
			'10': '40px',
			'11': '44px',
			'12': '48px',
			'14': '56px',
			'16': '64px',
			'20': '80px',
			'24': '96px',
			'28': '112px',
			'32': '128px',
			'36': '144px',
			'40': '160px',
			'44': '176px',
			'48': '192px',
			'52': '208px',
			'56': '224px',
			'60': '240px',
			'64': '256px',
			'72': '288px',
			'80': '320px',
			'96': '384px',
		},
		extend: {
			colors: {
				// Modern Twyst Design System
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				// Primary: Bold Clean Blue
				primary: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6', // Main primary
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554',
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				
				// Neutral Grays
				neutral: {
					50: '#fafafa',
					100: '#f5f5f5',
					200: '#e5e5e5',
					300: '#d4d4d4',
					400: '#a3a3a3',
					500: '#737373',
					600: '#525252',
					700: '#404040',
					800: '#262626',
					900: '#171717',
					950: '#0a0a0a',
				},
				
				// Accent Green (Success)
				accent: {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e', // Main accent
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d',
					950: '#052e16',
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				
				// Subtle Red (Destructive)
				destructive: {
					50: '#fef2f2',
					100: '#fee2e2',
					200: '#fecaca',
					300: '#fca5a5',
					400: '#f87171',
					500: '#ef4444', // Main destructive
					600: '#dc2626',
					700: '#b91c1c',
					800: '#991b1b',
					900: '#7f1d1d',
					950: '#450a0a',
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				
				warning: {
					50: '#fffbeb',
					100: '#fef3c7',
					200: '#fde68a',
					300: '#fcd34d',
					400: '#fbbf24',
					500: '#f59e0b', // Main warning
					600: '#d97706',
					700: '#b45309',
					800: '#92400e',
					900: '#78350f',
					950: '#451a03',
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				
				// App-specific colors
				'cart-bg': 'hsl(var(--cart-bg))',
				'cart-total': 'hsl(var(--cart-total))',
				'status-pending': 'hsl(var(--status-pending))',
				'status-preparing': 'hsl(var(--status-preparing))',
				'status-ready': 'hsl(var(--status-ready))',
				'status-completed': 'hsl(var(--status-completed))',
				
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				none: '0px',
				sm: '4px',
				DEFAULT: '8px',
				md: '12px', // Primary radius
				lg: '16px',
				xl: '20px',
				'2xl': '24px',
				'3xl': '32px',
				full: '9999px',
			},
			boxShadow: {
				// Soft, modern shadows
				'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.05)',
				'soft-md': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 8px 24px -4px rgba(0, 0, 0, 0.08)',
				'soft-lg': '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 16px 48px -8px rgba(0, 0, 0, 0.1)',
				'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
				'glow-accent': '0 0 20px rgba(34, 197, 94, 0.15)',
				'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
				'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.08)',
			},
			backdropBlur: {
				xs: '2px',
			},
			keyframes: {
				// Enhanced animations
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'slide-up': {
					from: { transform: 'translateY(100%)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-down': {
					from: { transform: 'translateY(0)', opacity: '1' },
					to: { transform: 'translateY(100%)', opacity: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					from: { opacity: '1', transform: 'translateY(0)' },
					to: { opacity: '0', transform: 'translateY(10px)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.95)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'scale-out': {
					from: { opacity: '1', transform: 'scale(1)' },
					to: { opacity: '0', transform: 'scale(0.95)' }
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-2px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)' },
					'50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.25)' }
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-down': 'slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
				'fade-in': 'fade-in 0.2s ease-out',
				'fade-out': 'fade-out 0.15s ease-in',
				'scale-in': 'scale-in 0.2s ease-out',
				'scale-out': 'scale-out 0.15s ease-in',
				'bounce-gentle': 'bounce-gentle 2s infinite',
				'pulse-glow': 'pulse-glow 2s infinite',
				'shimmer': 'shimmer 1.5s infinite'
			},
			transitionTimingFunction: {
				'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
				'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
			},
			zIndex: {
				'base': '1',
				'elevated': '10',
				'header': '40',
				'catnav': '35',
				'cart': '50',
				'sheet': '60',
				'toast': '70',
				'overlay': '80',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
