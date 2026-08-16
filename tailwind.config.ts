import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#060907",
        panel: "#0f1613",
        surface: "#0c1210",
        border: "#1c2a24",
        primary: {
          DEFAULT: "#39FF88",
          dark: "#1f8a53"
        },
        text: {
          DEFAULT: "#EAFBF3",
          muted: "#7b9088"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 24px 0 rgba(57, 255, 136, 0.15)",
        "glow-sm": "0 0 12px 0 rgba(57, 255, 136, 0.12)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
} satisfies Config;
