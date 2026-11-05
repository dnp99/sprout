import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { usePageScrollReset } from "./usePageScrollReset";
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function Host({ page, enabled = true }: { page: string; enabled?: boolean }) {
  const ref = usePageScrollReset(page, enabled);
  return <div ref={ref} style={{ scrollBehavior: "smooth" }} />;
}
it("resets page changes before paint while preserving same-page scrolling", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Host page="settings" />));
  const viewport = container.querySelector("div")!;
  viewport.scrollTop = 2545;
  act(() => root.render(<Host page="settings" />));
  expect(viewport.scrollTop).toBe(2545);
  act(() => root.render(<Host page="budget" />));
  expect(viewport.scrollTop).toBe(0);
  expect(viewport.style.scrollBehavior).toBe("smooth");
  viewport.scrollTop = 120;
  act(() => root.render(<Host page="goals" enabled={false} />));
  expect(viewport.scrollTop).toBe(120);
});
