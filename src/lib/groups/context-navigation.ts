/** Financial context changes preserve the functional section, never private data. */
export function contextSection(path: string, requested?: string | null): string {
  const section = path.startsWith("/groups/")
    ? path.split("/")[3]
    : path === "/groups"
      ? requested
      : path.slice(1);
  return [
    "categories",
    "transactions",
    "budget",
    "trends",
    "goals",
    "settings",
    "bills",
    "import",
    "settlements",
  ].includes(section ?? "")
    ? section!
    : "overview";
}
export function personalContextPath(section: string): string {
  return section === "overview" || section === "settlements"
    ? "/home"
    : section === "budget"
      ? "/categories"
      : `/${section}`;
}
export function groupContextPath(id: string | undefined, section: string): string {
  const normalized = section === "categories" ? "budget" : section;
  return id
    ? `/groups/${id}${normalized === "overview" ? "" : `/${normalized}`}`
    : `/groups${normalized === "overview" ? "" : `?section=${encodeURIComponent(normalized)}`}`;
}

/** A plain Groups entry skips the chooser only for a single available group.
 * Explicit management/invitation entry points must remain reachable. */
export function soleGroupDestination(
  groups: readonly { id: string }[],
  section: string,
  managing = false,
  hasInvitation = false,
): string | null {
  return groups.length === 1 && !managing && !hasInvitation
    ? groupContextPath(groups[0].id, section)
    : null;
}
