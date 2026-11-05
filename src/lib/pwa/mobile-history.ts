const FIELD = "__sproutMobileLayers";
const handled = new WeakSet<Event>();
type Layer = { id: string; url: string; close: () => void; closing: boolean; popped: boolean };

/** Same-document layers use history only for UI state, never financial drafts.
 * Capture runs before route synchronization so Back dismisses the top layer
 * without resetting the underlying Personal screen. Next's history state survives. */
export function createMobileHistory(win: Window) {
  const layers: Layer[] = [];
  let sequence = 0;
  const ids = () => {
    const value = win.history.state?.[FIELD];
    return Array.isArray(value) ? (value as string[]) : [];
  };
  const url = () => win.location.pathname + win.location.search + win.location.hash;
  const pop = (event: PopStateEvent) => {
    const remaining = ids();
    const removed = layers.filter((layer) => !remaining.includes(layer.id));
    if (!removed.length) return;
    if (removed.every((layer) => layer.url === url())) handled.add(event);
    removed.reverse().forEach((layer) => {
      layer.popped = true;
      if (!layer.closing && layer.url === url()) layer.close();
      // Busy dialogs can decline close. Re-arm the layer after React commits,
      // rather than allowing the next Back to escape an in-flight operation.
      win.requestAnimationFrame(() => {
        if (!layer.closing && layer.url === url() && layers.includes(layer)) {
          layer.popped = false;
          win.history.pushState({ ...win.history.state, [FIELD]: [...ids(), layer.id] }, "");
        } else {
          const index = layers.indexOf(layer);
          if (index >= 0) layers.splice(index, 1);
        }
      });
    });
  };
  win.addEventListener("popstate", pop, true);
  return {
    open(close: () => void) {
      const layer: Layer = {
        id: `layer-${++sequence}-${Date.now()}`,
        url: url(),
        close,
        closing: false,
        popped: false,
      };
      // StrictMode may mount/unmount an effect in the same commit. Defer the
      // history entry until the next frame so a discarded mount leaves no entry.
      let registered = false;
      let frame = 0;
      const register = () => {
        if (layer.closing) return;
        // Finish a pending UI-close traversal before placing a new dialog on top.
        if (layers.some((entry) => entry.closing && !entry.popped && ids().includes(entry.id))) {
          frame = win.requestAnimationFrame(register);
          return;
        }
        registered = true;
        layers.push(layer);
        win.history.pushState({ ...win.history.state, [FIELD]: [...ids(), layer.id] }, "");
      };
      frame = win.requestAnimationFrame(register);
      return () => {
        layer.closing = true;
        win.cancelAnimationFrame(frame);
        if (!registered) return;
        if (!layer.popped && layer.url === url() && ids()[ids().length - 1] === layer.id)
          win.requestAnimationFrame(() => {
            if (layer.url === url() && ids()[ids().length - 1] === layer.id) win.history.back();
          });
        else if (!layer.popped) {
          win.history.replaceState(
            { ...win.history.state, [FIELD]: ids().filter((id) => id !== layer.id) },
            "",
          );
          const index = layers.indexOf(layer);
          if (index >= 0) layers.splice(index, 1);
        }
      };
    },
    abandon() {
      const owned = new Set(layers.map((layer) => layer.id));
      layers.forEach((layer) => {
        layer.closing = true;
        layer.popped = true;
      });
      layers.length = 0;
      win.history.replaceState(
        { ...win.history.state, [FIELD]: ids().filter((id) => !owned.has(id)) },
        "",
      );
    },
    dispose() {
      win.removeEventListener("popstate", pop, true);
    },
  };
}
let controller: ReturnType<typeof createMobileHistory> | undefined;
/** One controller coordinates nested account/editor dialogs in the same window. */
export function openMobileHistoryLayer(close: () => void) {
  controller ??= createMobileHistory(window);
  return controller.open(close);
}
/** Route synchronization must leave the background alone on a handled layer Back. */
export function isMobileLayerBack(event: Event) {
  return handled.has(event);
}

/** New top-level routes replace transient UI metadata before Next pushes a path. */
export function abandonMobileHistoryLayers() {
  controller?.abandon();
}
