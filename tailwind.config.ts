import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sagard: {
          50: "#fdf5f6",
          100: "#f9e8eb",
          200: "#f2d0d6",
          400: "#b85a6b",
          500: "#9e4456",
          600: "#7a3344",
          700: "#6b2d3c",
          800: "#5a2533",
          900: "#4a1f2a",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f7f5f3",
          elevated: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(20, 18, 16, 0.08)",
        card: "0 4px 24px -6px rgba(20, 18, 16, 0.1)",
        glow: "0 0 0 1px rgba(107, 45, 60, 0.08), 0 8px 32px -8px rgba(107, 45, 60, 0.15)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
