/** Keep overlays inside the visible keyboard viewport and browser chrome in
 * the resolved app theme. No financial data or browser history is persisted. */
export function startPwaPresentation(win: Window) {
  const root = win.document.documentElement;
  let frame = 0;
  const update = () => {
    win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(() => {
      const viewport = win.visualViewport;
      root.style.setProperty("--app-viewport-height", `${viewport?.height ?? win.innerHeight}px`);
      root.style.setProperty("--app-viewport-top", `${viewport?.offsetTop ?? 0}px`);
      const color = win.getComputedStyle(root).getPropertyValue("--bg").trim();
      if (color)
        win.document
          .querySelectorAll('meta[name="theme-color"]')
          .forEach((meta) => meta.setAttribute("content", color));
    });
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { attributes: true, attributeFilter: ["class", "data-visual-theme"] });
  win.visualViewport?.addEventListener("resize", update);
  win.visualViewport?.addEventListener("scroll", update);
  win.addEventListener("resize", update);
  update();
  return () => {
    observer.disconnect();
    win.cancelAnimationFrame(frame);
    win.visualViewport?.removeEventListener("resize", update);
    win.visualViewport?.removeEventListener("scroll", update);
    win.removeEventListener("resize", update);
    root.style.removeProperty("--app-viewport-height");
    root.style.removeProperty("--app-viewport-top");
  };
}
