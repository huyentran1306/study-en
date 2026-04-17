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
        kawaii: ["Nunito", "Comic Neue", "system-ui", "sans-serif"],
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
        // Kawaii colors
        kawaii: {
          purple: "#a78bfa",
          pink: "#f472b6",
          sky: "#7dd3fc",
          mint: "#6ee7b7",
          yellow: "#fcd34d",
          peach: "#fca5a5",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "2rem",
        "4xl": "2.5rem",
        blob: "60% 40% 30% 70% / 60% 30% 70% 40%",
      },
      backgroundImage: {
        "gradient-kawaii": "linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #7dd3fc 100%)",
        "gradient-purple": "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
        "gradient-pink": "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
        "gradient-sky": "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)",
        "gradient-mint": "linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)",
        "gradient-sunset": "linear-gradient(135deg, #fcd34d 0%, #f472b6 100%)",
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
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-15px) rotate(5deg)" },
        },
        "pulse-scale": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(20deg)" },
          "75%": { transform: "rotate(-20deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        wiggle: "wiggle 1s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "float-slow": "float-slow 4s ease-in-out infinite",
        "pulse-scale": "pulse-scale 2s ease-in-out infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        wave: "wave 1s ease-in-out infinite",
      },
      boxShadow: {
        kawaii: "0 8px 30px -8px rgba(167, 139, 250, 0.4)",
        "kawaii-lg": "0 12px 40px -10px rgba(167, 139, 250, 0.5)",
        "kawaii-pink": "0 8px 30px -8px rgba(244, 114, 182, 0.4)",
        "kawaii-sky": "0 8px 30px -8px rgba(125, 211, 252, 0.4)",
        "kawaii-mint": "0 8px 30px -8px rgba(110, 231, 183, 0.4)",
        glow: "0 0 20px rgba(167, 139, 250, 0.5)",
        "glow-lg": "0 0 40px rgba(167, 139, 250, 0.6)",
        cute: "0 4px 20px -4px hsl(262 83% 58% / 0.25)",
        "cute-lg": "0 8px 40px -8px hsl(262 83% 58% / 0.3)",
        card: "0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
