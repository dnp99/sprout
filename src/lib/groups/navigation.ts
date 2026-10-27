/** Only same-origin household paths may survive the login redirect. */
export function groupReturnPath(value: string | null): string | null {
  return value &&
    /^\/groups(?:\/[a-f0-9-]{36}(?:\/(?:transactions|budget|trends|goals|bills|import|settlements|settings))?)?$/.test(
      value,
    )
    ? value
    : null;
}
export function isGroupPath(value: string): boolean {
  return value === "/groups" || value.startsWith("/groups/");
}

/** Date-only entry defaults follow the user's device, not the server's UTC day. */
export function groupToday(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function shiftGroupMonth(month: string, direction: number): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + direction, 1)).toISOString().slice(0, 7);
}
