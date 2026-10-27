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
