/** Increment only for a curated, user-facing release, never for every deployment. */
export const CURRENT_RELEASE = {
  version: 1,
  publishedOn: "2026-11-01",
  highlights: [
    { key: "settlements", href: "/groups" },
    { key: "entry", href: "/groups" },
    { key: "appearance", href: "/settings" },
  ],
} as const;

/** Missing acknowledgements include existing accounts created before release announcements. */
export function hasUnseenRelease(seenVersion = 0): boolean {
  return seenVersion < CURRENT_RELEASE.version;
}

/** Reject future versions so a client cannot silence announcements that do not exist yet. */
export function validReleaseVersion(version: unknown): version is number {
  return (
    typeof version === "number" &&
    Number.isInteger(version) &&
    version > 0 &&
    version <= CURRENT_RELEASE.version
  );
}
