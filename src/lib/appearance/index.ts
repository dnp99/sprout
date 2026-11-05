export const VISUAL_THEMES = ["vibrant", "cozy", "elegant"] as const;
export type VisualTheme = (typeof VISUAL_THEMES)[number];
export const DEFAULT_VISUAL_THEME: VisualTheme = "elegant";
export type ThemePref = "system" | "light" | "dark";

/** Unknown or retired choices retain Sprout's default appearance. */
export function parseVisualTheme(value: string | null): VisualTheme {
  return VISUAL_THEMES.includes(value as VisualTheme)
    ? (value as VisualTheme)
    : DEFAULT_VISUAL_THEME;
}

/** Resolve only the color mode; choosing a palette never overrides the OS preference. */
export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Apply mode without replacing the independently selected visual palette. */
export function applyTheme(theme: "light" | "dark") {
  if (typeof document !== "undefined")
    document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Storage can be blocked; settings still work for the current session. */
function persist(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* The DOM and in-memory preference remain usable. */
  }
}

function read(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** System mode removes the override so device changes continue to apply. */
export function persistPref(pref: ThemePref) {
  persist("sprout-theme", pref === "system" ? null : pref);
}

/** Existing light/dark preferences remain compatible with palette selection. */
export function readPref(): ThemePref {
  const stored = read("sprout-theme");
  return stored === "light" || stored === "dark" ? stored : "system";
}

/** Absent or unrecognized storage values use the shared default palette. */
export function readVisualTheme(): VisualTheme {
  return parseVisualTheme(read("sprout-visual-theme"));
}

/** Presentation only: no category records or account data change with the palette. */
export function applyVisualTheme(theme: VisualTheme) {
  if (typeof document !== "undefined") document.documentElement.dataset.visualTheme = theme;
}

/** Persist every explicit choice so future default changes cannot replace it. */
export function persistVisualTheme(theme: VisualTheme) {
  persist("sprout-visual-theme", theme);
}

// Both root layouts run this before paint. Independent guards let system mode
// work even when localStorage is blocked by the browser.
export const appearanceScript = `(function(){var t,v;try{t=localStorage.getItem('sprout-theme');v=localStorage.getItem('sprout-visual-theme')}catch(e){}document.documentElement.dataset.visualTheme=v==='vibrant'||v==='cozy'||v==='elegant'?v:'${DEFAULT_VISUAL_THEME}';try{document.documentElement.classList.toggle('dark',t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))}catch(e){}})()`;
