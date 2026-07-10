import type { Config } from "tailwindcss";

/**
 * Sprout design tokens — the shadcn-hybrid system from the "Overview Revised"
 * claude.ai/design handoff. Every color resolves to a CSS variable defined in
 * `src/app/globals.css` (`:root` = light, `.dark` = dark), so the whole app
 * themes by toggling the `.dark` class. Use the semantic classes below; never
 * hard-code hex in components (the sole exception is a category's own dynamic
 * accent color, passed through `style`).
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: "var(--bg)", // app canvas
        card: "var(--card)", // card surface
        sidebar: "var(--sidebar)", // left nav rail
        surface: "var(--surface)", // rare dark surface
        track: "var(--muted-bg)", // muted fills / progress track
        // Borders
        edge: "var(--border)", // hairline borders
        "soft-border": "var(--soft-border)", // primary-tinted borders
        // Ink
        ink: "var(--fg)", // primary text
        muted: "var(--muted)", // secondary text
        subtle: "var(--subtle)", // tertiary / hints
        // Brand
        primary: "var(--primary)", // terracotta
        "primary-dark": "var(--primary-dark)",
        "primary-soft": "var(--primary-soft)", // primary tint
        onprimary: "var(--add-fg)", // text/icon on primary surfaces
        // Semantic
        green: "var(--pos)", // income / positive
        // Category accents (static — category rows also pass their own via `style`)
        clay: "#c98a5a",
        gold: "#e7a34a",
        peach: "#f2c8a8",
        "peach-soft": "#f2ddc8",
      },
      fontFamily: {
        // Geist across the whole app (display + body), per the design.
        display: ["var(--font-geist)", "system-ui", "sans-serif"],
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        // Marketing landing only (from the design handoff): Bricolage Grotesque
        // for headings, Figtree for body. These CSS vars are set on the landing
        // root by next/font, so the app itself is unaffected and stays Geist.
        bricolage: ["var(--font-bricolage)", "var(--font-geist)", "sans-serif"],
        figtree: ["var(--font-figtree)", "var(--font-geist)", "sans-serif"],
      },
      borderRadius: {
        card: "14px", // design --radius
        tile: "12px",
        pill: "10px",
        window: "16px", // outer app window
      },
      maxWidth: {
        app: "440px",
      },
      keyframes: {
        // A text-cursor blink for the caret-less amount entry (see AddForm).
        "caret-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
