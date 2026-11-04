/** SVG colors come from resolved root tokens, never a ledger-local rail palette. */
export function themeFaviconUrl(primary: string, foreground: string) {
  const escape = (value: string) =>
    value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${escape(primary)}"/><g transform="translate(12 12) scale(1.667)" fill="none" stroke="${escape(foreground)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A new data URL bypasses cached legacy icons; only mutate changed links to
 * avoid looping the head observer after Next refreshes its metadata. */
export function syncThemeFavicon(win: Window, styles: CSSStyleDeclaration) {
  const primary = styles.getPropertyValue("--primary").trim();
  const foreground = styles.getPropertyValue("--add-fg").trim();
  if (!primary || !foreground) return;
  const href = themeFaviconUrl(primary, foreground);
  win.document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((link) => {
    if (link.getAttribute("href") === href) return;
    link.setAttribute("type", "image/svg+xml");
    link.setAttribute("sizes", "any");
    link.setAttribute("href", href);
  });
}
