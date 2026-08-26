import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16211B",
        acacia: {
          DEFAULT: "#1F3A2E",
          light: "#2E5342",
          dark: "#122019",
        },
        parchment: "#F6F3EC",
        ochre: {
          DEFAULT: "#E8A33D",
          dark: "#C9822A",
        },
        pulse: {
          DEFAULT: "#3FA34D",
          soft: "#CFEBD3",
        },
        clay: "#C9762B",
        line: "#E3DED2",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "pulse-ring": "pulseRing 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
