import containerQueries from "@tailwindcss/container-queries";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import { fontFamily } from "tailwindcss/defaultTheme";
const config: Config = {
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "4rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				nodes: {
					trigger: {
						DEFAULT: "hsl(var(--node-trigger))",

						foreground: "hsl(var(--node-trigger-foreground))",
					},

					task: {
						DEFAULT: "hsl(var(--node-task))",

						foreground: "hsl(var(--node-task-foreground))",
					},

					action: {
						DEFAULT: "hsl(var(--node-action))",

						foreground: "hsl(var(--node-action-foreground))",
					},
				},
				primary: {
					50: "#daf1de",
					100: "#8eb69b",
					200: "#235347",
					300: "#163832",
					400: "#0b2b26",
					500: "#051f20",
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
				},
				// Node-specific colors
				node: {
					trigger: "#235347",
					triggerForeground: "#daf1de",
					task: "#163832",
					taskForeground: "#8eb69b",
					action: "#0b2b26",
					actionForeground: "#daf1de",
				},
				border: "#235347",
				input: "#235347",
				ring: "#8eb69b",
				background: "#051f20",
				foreground: "#daf1de",
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
				},
				muted: "#235347",
				mutedForeground: "#8eb69b",
				accent: "#163832",
				accentForeground: "#daf1de",
				popover: "#163832",
				popoverForeground: "#daf1de",
				card: "#0b2b26",
				cardForeground: "#8eb69b",
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
				},
			},
			borderRadius: {
				xl: "calc(var(--radius) + 4px)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			fontFamily: {
				sans: ["geist-sans", ...fontFamily.sans],
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--bits-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--bits-accordion-content-height)" },
					to: { height: "0" },
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"caret-blink": "caret-blink 1.25s ease-out infinite",
			},
		},
	},
	plugins: [typography, forms, containerQueries, tailwindcssAnimate],
};

export default config;
