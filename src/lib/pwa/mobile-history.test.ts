import { expect, it, vi } from "vitest";
import { createMobileHistory, isMobileLayerBack } from "./mobile-history";

function browser() {
  const target = new EventTarget();
  const frames = new Map<number, FrameRequestCallback>();
  let sequence = 0,
    index = 0;
  const entries: unknown[] = [{ __NA: true, tree: "router-state" }];
  const history = {
    get state() {
      return entries[index];
    },
    pushState(state: unknown) {
      entries.splice(++index);
      entries[index] = state;
    },
    replaceState(state: unknown) {
      entries[index] = state;
    },
    back: vi.fn(() => {
      if (index > 0) {
        index--;
        target.dispatchEvent(new PopStateEvent("popstate"));
      }
    }),
  };
  const win = {
    history,
    location: { pathname: "/transactions", search: "?cat=food", hash: "" },
    requestAnimationFrame(callback: FrameRequestCallback) {
      frames.set(++sequence, callback);
      return sequence;
    },
    cancelAnimationFrame(id: number) {
      frames.delete(id);
    },
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  } as unknown as Window;
  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  };
  return {
    win,
    history,
    target,
    flush,
    get index() {
      return index;
    },
  };
}
it("dismisses only the top mobile layer and preserves Next history state", () => {
  const b = browser(),
    controller = createMobileHistory(b.win);
  let closeFirst = () => {},
    closeSecond = () => {};
  const first = vi.fn(() => closeFirst());
  const second = vi.fn(() => closeSecond());
  closeFirst = controller.open(first);
  b.flush();
  closeSecond = controller.open(second);
  b.flush();
  let handled = false;
  b.target.addEventListener("popstate", (event) => {
    handled = isMobileLayerBack(event);
  });
  b.history.back();
  b.flush();
  expect(second).toHaveBeenCalledOnce();
  expect(first).not.toHaveBeenCalled();
  expect(handled).toBe(true);
  expect(b.history.state).toMatchObject({ __NA: true, tree: "router-state" });
  closeFirst();
  b.flush();
  b.flush();
  expect(first).not.toHaveBeenCalled();
  expect(b.index).toBe(0);
  controller.dispose();
});
it("does not create an entry for a discarded StrictMode mount", () => {
  const b = browser(),
    controller = createMobileHistory(b.win);
  controller.open(vi.fn())();
  b.flush();
  expect(b.index).toBe(0);
  expect(b.history.back).not.toHaveBeenCalled();
  controller.dispose();
});
it("re-arms a busy dialog that declines Back and abandons layers before a new route", () => {
  const b = browser(),
    controller = createMobileHistory(b.win),
    close = vi.fn();
  const stop = controller.open(close);
  b.flush();
  b.history.back();
  b.flush();
  expect(close).toHaveBeenCalledOnce();
  expect(b.index).toBe(1);
  stop();
  controller.abandon();
  b.flush();
  expect(b.history.back).toHaveBeenCalledTimes(1);
  expect(b.history.state).toMatchObject({ __NA: true, __sproutMobileLayers: [] });
  controller.dispose();
});
