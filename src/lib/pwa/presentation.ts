import { syncThemeFavicon } from "@/lib/appearance/favicon";

/** Viewport geometry is cheap and independent of palette/favicon work. Neither
 * keyboard panning nor momentum scrolling needs a computed-style read. */
export function startPwaPresentation(win: Window) {
  const root = win.document.documentElement;
  let geometryFrame = 0,
    themeFrame = 0;
  const geometry = () => {
    win.cancelAnimationFrame(geometryFrame);
    geometryFrame = win.requestAnimationFrame(() => {
      const viewport = win.visualViewport;
      // Pinch zoom must remain browser-owned, rather than shrinking the app frame.
      const unzoomed = !viewport || Math.abs(viewport.scale - 1) < 0.01;
      const height = unzoomed ? (viewport?.height ?? win.innerHeight) : win.innerHeight;
      const top = unzoomed ? (viewport?.offsetTop ?? 0) : 0;
      const keyboard =
        unzoomed &&
        win.innerHeight - height > 150 &&
        !!win.document.activeElement?.matches("input,textarea,select,[contenteditable=true]");
      root.style.setProperty("--app-viewport-height", `${height}px`);
      root.style.setProperty("--app-viewport-top", `${top}px`);
      root.style.setProperty(
        "--app-viewport-bottom",
        `${Math.max(0, win.innerHeight - height - top)}px`,
      );
      root.dataset.appKeyboardOpen = String(keyboard);
    });
  };
  const theme = () => {
    win.cancelAnimationFrame(themeFrame);
    themeFrame = win.requestAnimationFrame(() => {
      const styles = win.getComputedStyle(root);
      syncThemeFavicon(win, styles);
      const color = styles.getPropertyValue("--bg").trim();
      if (color)
        win.document
          .querySelectorAll('meta[name="theme-color"]')
          .forEach((meta) => meta.setAttribute("content", color));
    });
  };
  const observer = new MutationObserver(theme);
  observer.observe(root, { attributes: true, attributeFilter: ["class", "data-visual-theme"] });
  const headObserver = new MutationObserver(theme);
  headObserver.observe(win.document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href", "rel"],
  });
  win.visualViewport?.addEventListener("resize", geometry);
  win.visualViewport?.addEventListener("scroll", geometry);
  win.addEventListener("resize", geometry);
  win.document.addEventListener("focusin", geometry);
  win.document.addEventListener("focusout", geometry);
  geometry();
  theme();
  return () => {
    observer.disconnect();
    headObserver.disconnect();
    win.cancelAnimationFrame(geometryFrame);
    win.cancelAnimationFrame(themeFrame);
    win.visualViewport?.removeEventListener("resize", geometry);
    win.visualViewport?.removeEventListener("scroll", geometry);
    win.removeEventListener("resize", geometry);
    win.document.removeEventListener("focusin", geometry);
    win.document.removeEventListener("focusout", geometry);
    ["--app-viewport-height", "--app-viewport-top", "--app-viewport-bottom"].forEach((property) =>
      root.style.removeProperty(property),
    );
    delete root.dataset.appKeyboardOpen;
  };
}
