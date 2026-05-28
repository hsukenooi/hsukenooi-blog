import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        serif: ["Lora", ...defaultTheme.fontFamily.serif],
      },
      colors: {
        brand: {
          bg: "#f7f6f4",
          border: "#e5e3df",
          text: "#1a1a1a",
          muted: "#6b6b6b",
          link: "#1a1a1a",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
