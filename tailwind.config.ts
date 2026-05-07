import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: { 50: "#FEFDFB", 100: "#FDF9F3", 200: "#F9F2E6", DEFAULT: "#F9F6F0" },
        gold:  { light: "#E8C98A", DEFAULT: "#C9A96E", dark: "#A88240" },
        forest: { light: "#5D4037", DEFAULT: "#3E2723", dark: "#1F1310" },
        champagne: "#F7E7CE",
        beige: { light: "#F0E8DC", DEFAULT: "#E8DDD0", dark: "#D4C4B0" },
        charcoal: "#2C2C2C",
        obsidian: "#0A0A0A",
      },
      fontFamily: {
        sans:  ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gold-gradient":   "linear-gradient(135deg, #C9A96E 0%, #E8C98A 50%, #C9A96E 100%)",
        "forest-gradient": "linear-gradient(180deg, #3E2723 0%, #1F1310 100%)",
        "ivory-gradient":  "linear-gradient(180deg, #FEFDFB 0%, #F9F6F0 100%)",
      },
    },
  },
  plugins: [],
}

export default config
