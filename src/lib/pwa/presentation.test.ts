import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { startPwaPresentation } from "./presentation";
vi.mock("@/lib/appearance/favicon", () => ({ syncThemeFavicon: vi.fn() }));
let stop: () => void;
let frames: Map<number, FrameRequestCallback>;
let viewport: EventTarget & { height: number; offsetTop: number; scale: number };
let styles: ReturnType<typeof vi.spyOn>;
const flush = () => {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((callback) => callback(0));
};
beforeEach(() => {
  frames = new Map();
  let id = 0;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frames.set(++id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((frame) => {
    frames.delete(frame);
  });
  viewport = Object.assign(new EventTarget(), {
    height: window.innerHeight,
    offsetTop: 0,
    scale: 1,
  });
  vi.stubGlobal("visualViewport", viewport);
  styles = vi
    .spyOn(window, "getComputedStyle")
    .mockReturnValue({ getPropertyValue: () => "theme-color" } as unknown as CSSStyleDeclaration);
  stop = startPwaPresentation(window);
  flush();
});
afterEach(() => {
  stop();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("coalesces keyboard geometry without reading palette styles on viewport scrolling", () => {
  expect(styles).toHaveBeenCalledTimes(1);
  const input = document.createElement("input");
  document.body.append(input);
  input.focus();
  viewport.height = 300;
  viewport.offsetTop = 12;
  for (let i = 0; i < 20; i++) viewport.dispatchEvent(new Event("scroll"));
  flush();
  const root = document.documentElement;
  expect(root.style.getPropertyValue("--app-viewport-height")).toBe("300px");
  expect(root.dataset.appKeyboardOpen).toBe("true");
  expect(styles).toHaveBeenCalledTimes(1);
  stop();
  expect(root.style.getPropertyValue("--app-viewport-height")).toBe("");
  expect(root.hasAttribute("data-app-keyboard-open")).toBe(false);
});
it("leaves pinch zoom with the browser instead of resizing the app to the zoomed viewport", () => {
  viewport.scale = 2;
  viewport.height = 200;
  viewport.offsetTop = 150;
  viewport.dispatchEvent(new Event("resize"));
  flush();
  expect(document.documentElement.style.getPropertyValue("--app-viewport-height")).toBe(
    `${window.innerHeight}px`,
  );
  expect(document.documentElement.style.getPropertyValue("--app-viewport-top")).toBe("0px");
});
