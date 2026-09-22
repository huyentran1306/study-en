import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        kawaii: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Pro Palette mapping (backward-compatible aliases mapped to executive tones)
        kawaii: {
          purple: "#6366f1", // Indigo 500
          pink: "#ec4899",   // Pink 500
          sky: "#0284c7",    // Sky 600
          mint: "#10b981",   // Emerald 500
          yellow: "#f59e0b", // Amber 500
          peach: "#f97316",  // Orange 500
          lavender: "#8b5cf6", // Violet 500
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        blob: "1.25rem",
      },
      backgroundImage: {
        "gradient-pro": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0284c7 100%)",
        "gradient-kawaii": "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #0ea5e9 100%)",
        "gradient-purple": "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        "gradient-pink": "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        "gradient-sky": "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
        "gradient-mint": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        "gradient-sunset": "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-scale": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.9)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(10deg)" },
          "75%": { transform: "rotate(-10deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        wiggle: "wiggle 1s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-scale": "pulse-scale 2.5s ease-in-out infinite",
        "bounce-soft": "bounce-soft 2.5s ease-in-out infinite",
        sparkle: "sparkle 2.5s ease-in-out infinite",
        "spin-slow": "spin-slow 12s linear infinite",
        wave: "wave 1.2s ease-in-out infinite",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        kawaii: "0 10px 25px -5px rgba(99, 102, 241, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        "kawaii-lg": "0 20px 35px -10px rgba(99, 102, 241, 0.18), 0 10px 12px -6px rgba(0, 0, 0, 0.06)",
        "kawaii-pink": "0 10px 25px -5px rgba(236, 72, 153, 0.12)",
        "kawaii-sky": "0 10px 25px -5px rgba(2, 132, 199, 0.12)",
        "kawaii-mint": "0 10px 25px -5px rgba(16, 185, 129, 0.12)",
        glow: "0 0 25px rgba(99, 102, 241, 0.35)",
        "glow-lg": "0 0 45px rgba(99, 102, 241, 0.45)",
        cute: "0 4px 16px -2px rgba(99, 102, 241, 0.16)",
        "cute-lg": "0 8px 30px -4px rgba(99, 102, 241, 0.2)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 12px 30px -8px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
