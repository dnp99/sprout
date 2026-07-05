import type { Config } from "tailwindcss";

/**
 * Sprout design tokens — the "friendly & playful" variant from the Budget App
 * prototype (claude.ai/design handoff). Palette, radii and font stacks are
 * lifted directly from the prototype source so the app stays pixel-faithful.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: "#fbf3e9", // app background (warm cream)
        card: "#ffffff", // card surface
        surface: "#4a3b2e", // dark surface (budget hero)
        track: "#f0e5d6", // progress-bar track
        // Ink
        ink: "#4a3b2e", // primary text
        muted: "#a08d78", // secondary text
        subtle: "#c9b49b", // tertiary / hints
        // Brand
        primary: "#d97a54", // terracotta
        "primary-dark": "#c25b3a",
        // Category accents
        clay: "#c98a5a",
        green: "#7e9b6b",
        gold: "#e7a34a",
        // Tints
        peach: "#f2c8a8",
        "peach-soft": "#f2ddc8",
        edge: "#e3ccae", // dashed borders
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "Figtree", "system-ui", "sans-serif"],
        sans: ["var(--font-figtree)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        tile: "22px",
        pill: "16px",
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
