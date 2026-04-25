import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#4A90E2",
          purple: "#7B68EE",
          teal: "#40E0D0",
          navy: "#1a1f3a",
          dark: "#0f1224",
          black: "#0a0c1a",
        },
        surface: {
          light: "#f8f9ff",
          card: "rgba(255,255,255,0.05)",
          hover: "rgba(255,255,255,0.08)",
        },
        text: {
          white: "#ffffff",
          light: "#e8eaf6",
          muted: "#9fa8c7",
          dark: "#1a1f3a",
          body: "#2c3060",
        },
        ui: {
          success: "#27ae60",
          warning: "#f39c12",
          danger: "#e74c3c",
          info: "#3498db",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.1)",
          light: "#e1e5f5",
        },
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)",
        "gradient-teal": "linear-gradient(135deg, #40E0D0 0%, #4A90E2 100%)",
        "gradient-dark": "linear-gradient(135deg, #1a1f3a 0%, #0f1224 100%)",
        "gradient-purple": "linear-gradient(135deg, #7B68EE 0%, #9B59B6 100%)",
        "gradient-hero": "linear-gradient(135deg, #0f1224 0%, #1a1f3a 40%, #2d2060 100%)",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(74,144,226,0.15)",
        md: "0 8px 32px rgba(74,144,226,0.2)",
        lg: "0 16px 48px rgba(74,144,226,0.25)",
        card: "0 4px 20px rgba(0,0,0,0.3)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      animation: {
        "orb-float": "orbFloat 8s ease-in-out infinite",
        "card-float": "cardFloat 6s ease-in-out infinite",
        "main-card-float": "mainCardFloat 5s ease-in-out infinite",
        "slide-in-right": "slideInRight 0.3s ease",
        spin: "spin 0.8s linear infinite",
        "skeleton-pulse": "skeleton-pulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        orbFloat: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-30px) scale(1.05)" },
        },
        cardFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        mainCardFloat: {
          "0%, 100%": { transform: "translate(-50%,-50%) scale(1)" },
          "50%": { transform: "translate(-50%,-52%) scale(1.03)" },
        },
        slideInRight: {
          from: { transform: "translateX(100px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "skeleton-pulse": {
          "0%, 100%": { background: "#f0f3ff" },
          "50%": { background: "#e1e5f5" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
