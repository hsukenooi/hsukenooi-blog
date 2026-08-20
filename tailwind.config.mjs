import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      // Semantic color roles. The values, and the reasoning behind them, live
      // in src/styles/global.css under :root and .dark — that pair is the
      // single source of truth. This map only exposes them to Tailwind.
      colors: {
        surface: "var(--color-surface)",
        "surface-overlay": "var(--color-surface-overlay)",
        "surface-hover": "var(--color-surface-hover)",
        "surface-sunken": "var(--color-surface-sunken)",
        body: "var(--color-body)",
        muted: "var(--color-muted)",
        strong: "var(--color-strong)",
        danger: "var(--color-danger)",
        divider: "var(--color-divider)",
        control: "var(--color-control)",
        link: "var(--color-link)",
        "link-hover": "var(--color-link-hover)",
        focus: "var(--color-focus)",
        "image-edge": "var(--color-image-edge)",
        "stack-back": "var(--color-stack-back)",
        "stack-mid": "var(--color-stack-mid)",
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        serif: ["Lora", ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
