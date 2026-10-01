/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        steel: {
          950: "#0b1220",
          900: "#111c2e",
          800: "#182640",
          700: "#22344f",
          500: "#3d5570",
          300: "#8fa8c5",
        },
        volt: {
          DEFAULT: "#f59e0b",
          soft: "#fbbf24",
        },
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};
