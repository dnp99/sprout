import type { MobileScreen, WebView } from "./types";

/** The primary navigable sections, shared by the web and mobile surfaces. A
 *  section maps 1:1 to a `WebView` and to a URL path; the mobile surface reaches
 *  the same sections through its own (larger) `MobileScreen` vocabulary. */
export type Section = WebView;

const SECTIONS: Section[] = [
  "overview",
  "transactions",
  "categories",
  "trends",
  "goals",
  "bills",
  "import",
  "settings",
];

/** URL path for a section. Overview is the app root, `/home`. */
export function pathForSection(section: Section): string {
  return section === "overview" ? "/home" : `/${section}`;
}

/** The section a path maps to, or null for non-section paths (`/login`,
 *  `/logout`, `/`, or anything unknown). */
export function sectionForPath(pathname: string): Section | null {
  if (pathname === "/home") return "overview";
  const name = pathname.replace(/^\//, "");
  return name !== "overview" && SECTIONS.includes(name as Section) ? (name as Section) : null;
}

/** Every real section route path — used by the auth guard to recognise a valid
 *  signed-in destination. */
export const SECTION_PATHS: string[] = SECTIONS.map(pathForSection);

// Section ↔ primary mobile screen. The mobile surface has many more screens
// (detail views, add flows) that layer over a section without changing the URL.
const SECTION_TO_SCREEN: Record<Section, MobileScreen> = {
  overview: "home",
  transactions: "history",
  categories: "categories",
  trends: "trends",
  goals: "goals",
  bills: "bills",
  import: "import",
  settings: "settings",
};

const SCREEN_TO_SECTION: Partial<Record<MobileScreen, Section>> = Object.fromEntries(
  Object.entries(SECTION_TO_SCREEN).map(([section, screen]) => [screen, section as Section]),
);

/** The primary mobile screen that represents a section. */
export function sectionMobileScreen(section: Section): MobileScreen {
  return SECTION_TO_SCREEN[section];
}

/** The section a mobile screen belongs to, or null for detail/transient screens
 *  (catDetail, txnDetail, add flows, search) — those keep the URL parked on
 *  their parent section rather than pushing a new one. */
export function sectionForMobileScreen(screen: MobileScreen): Section | null {
  return SCREEN_TO_SECTION[screen] ?? null;
}
