const KEY = "sprout-edited-highlight";
/** A device preference, like appearance; storage restrictions must not block edits. */
export function readEditedHighlight(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}
export function persistEditedHighlight(enabled: boolean) {
  try {
    if (enabled) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, "off");
  } catch {}
}
