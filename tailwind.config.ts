import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#060907",

        panel: "#0F1613",

        surface: "#0C1210",

        border: "#1C2A24",

        primary: {
          DEFAULT: "#39FF88",
          dark: "#1F8A53",
          light: "#7CFFB0",
        },

        text: {
          DEFAULT: "#EAFBF3",
          muted: "#7B9088",
          subtle: "#53665F",
        },

        danger: {
          DEFAULT: "#FF5C5C",
          dark: "#B83A3A",
        },

        warning: {
          DEFAULT: "#FFC857",
          dark: "#B88724",
        },

        success: {
          DEFAULT: "#39FF88",
          dark: "#1F8A53",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      boxShadow: {
        glow: "0 0 24px 0 rgba(57, 255, 136, 0.15)",
        "glow-sm": "0 0 12px 0 rgba(57, 255, 136, 0.12)",
        "glow-lg": "0 0 48px 0 rgba(57, 255, 136, 0.10)",
      },

      borderRadius: {
        xl2: "1.25rem",
      },

      transitionTimingFunction: {
        "md-smooth": "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      transitionDuration: {
        180: "180ms",
        240: "240ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
