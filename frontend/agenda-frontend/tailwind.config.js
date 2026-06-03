/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate';

const withOpacity = (variable) => {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `var(${variable})`;
    }

    return `oklch(from var(${variable}) l c h / ${opacityValue})`;
  };
};

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: withOpacity('--border'),
  			input: withOpacity('--input'),
  			ring: withOpacity('--ring'),
  			background: withOpacity('--background'),
  			foreground: withOpacity('--foreground'),
  			primary: {
  				DEFAULT: withOpacity('--primary'),
  				foreground: withOpacity('--primary-foreground')
  			},
  			secondary: {
  				DEFAULT: withOpacity('--secondary'),
  				foreground: withOpacity('--secondary-foreground')
  			},
  			destructive: {
  				DEFAULT: withOpacity('--destructive'),
  				foreground: withOpacity('--destructive-foreground')
  			},
  			muted: {
  				DEFAULT: withOpacity('--muted'),
  				foreground: withOpacity('--muted-foreground')
  			},
  			accent: {
  				DEFAULT: withOpacity('--accent'),
  				foreground: withOpacity('--accent-foreground')
  			},
  			popover: {
  				DEFAULT: withOpacity('--popover'),
  				foreground: withOpacity('--popover-foreground')
  			},
  			card: {
  				DEFAULT: withOpacity('--card'),
  				foreground: withOpacity('--card-foreground')
  			},
  			sidebar: {
  				DEFAULT: withOpacity('--sidebar'),
  				foreground: withOpacity('--sidebar-foreground'),
  				primary: withOpacity('--sidebar-primary'),
  				'primary-foreground': withOpacity('--sidebar-primary-foreground'),
  				accent: withOpacity('--sidebar-accent'),
  				'accent-foreground': withOpacity('--sidebar-accent-foreground'),
  				border: withOpacity('--sidebar-border'),
  				ring: withOpacity('--sidebar-ring')
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [animate],
};
