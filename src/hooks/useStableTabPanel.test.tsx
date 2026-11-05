import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useStableTabPanel } from "./useStableTabPanel";
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function Harness() {
  const { panelRef, minHeight, prepareSwitch } = useStableTabPanel();
  return (
    <>
      <button onClick={prepareSwitch}>Switch</button>
      <div ref={panelRef} style={{ minHeight }} />
    </>
  );
}
it("reserves only the remaining viewport before a shorter panel replaces a list", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("innerHeight", 800);
  vi.stubGlobal("getComputedStyle", () => ({ overflowY: "visible" }));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
  const panel = container.querySelector("div")!;
  panel.getBoundingClientRect = () => ({ top: 300 }) as DOMRect;
  act(() => container.querySelector("button")!.click());
  expect(panel.style.minHeight).toBe("500px");
  panel.getBoundingClientRect = () => ({ top: 850 }) as DOMRect;
  act(() => container.querySelector("button")!.click());
  expect(Number.parseFloat(panel.style.minHeight)).toBe(0);
});
it("uses the nested scroll viewport and recomputes after a resize", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("innerHeight", 900);
  container = document.createElement("div");
  container.style.overflowY = "auto";
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
  container.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  Object.defineProperty(container, "clientHeight", { configurable: true, value: 600 });
  const panel = container.querySelector("div")!;
  panel.getBoundingClientRect = () => ({ top: 300 }) as DOMRect;
  act(() => container.querySelector("button")!.click());
  expect(panel.style.minHeight).toBe("400px");
  vi.stubGlobal("innerHeight", 500);
  act(() => window.dispatchEvent(new Event("resize")));
  expect(panel.style.minHeight).toBe("200px");
});
