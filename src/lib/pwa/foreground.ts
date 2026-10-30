/** Resume signals differ across installed browsers. Coalesce a burst into one
 * read-only revalidation and never enqueue or replay financial mutations. */
export function subscribeToForeground(win: Window, resume: () => Promise<void>) {
  let stopped = false,
    inFlight = false,
    last = -Infinity;
  const run = () => {
    if (
      stopped ||
      inFlight ||
      win.document.hidden ||
      win.navigator.onLine === false ||
      Date.now() - last < 1000
    )
      return;
    last = Date.now();
    inFlight = true;
    void resume()
      .catch(() => {})
      .finally(() => {
        inFlight = false;
      });
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) run();
  };
  win.addEventListener("focus", run);
  win.addEventListener("online", run);
  win.addEventListener("pageshow", onPageShow);
  win.document.addEventListener("visibilitychange", run);
  return () => {
    stopped = true;
    win.removeEventListener("focus", run);
    win.removeEventListener("online", run);
    win.removeEventListener("pageshow", onPageShow);
    win.document.removeEventListener("visibilitychange", run);
  };
}
