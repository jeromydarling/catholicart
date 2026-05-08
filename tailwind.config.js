/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        serif: ['"Spectral"', "Georgia", "serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        parchment: {
          50: "#fbf8f1",
          100: "#f5eede",
          200: "#ebe0c2",
          300: "#dcca97",
          400: "#c9b072",
        },
        ink: {
          DEFAULT: "#1c160e",
          soft: "#3a3024",
          muted: "#6b5e48",
        },
        burgundy: {
          50: "#f8eef0",
          100: "#ecd2d7",
          400: "#a23b4d",
          500: "#7a1f2c",
          600: "#5e1623",
          700: "#42101a",
        },
        gold: {
          300: "#dcc187",
          400: "#c9a961",
          500: "#a8893f",
          600: "#876b2c",
        },
        lapis: {
          400: "#3d5d92",
          500: "#28477a",
          600: "#1d3a6b",
          700: "#142a51",
        },
        olive: {
          500: "#6b6f3f",
          600: "#535835",
        },
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 22, 14, 0.06), 0 8px 24px -12px rgba(28, 22, 14, 0.18)",
        plate: "0 1px 0 rgba(28, 22, 14, 0.04), 0 24px 48px -32px rgba(28, 22, 14, 0.35)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 600ms ease-out both",
        "fade-in": "fade-in 800ms ease-out both",
      },
    },
  },
  plugins: [],
};
