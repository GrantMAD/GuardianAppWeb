import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "bg-primary": "var(--color-bg-primary)",
        "bg-card": "var(--color-bg-card)",
        "bg-elevated": "var(--color-bg-elevated)",
        "text-primary": "var(--color-text-primary)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
      }
    },
  },
  plugins: [],
} satisfies Config;
