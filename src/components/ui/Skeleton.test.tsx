import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { SkeletonRows } from "./Skeleton";
import { LoadingRegion, LoadingStatus } from "./LoadingIndicator";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function render(node: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(node));
}
it("renders the requested rows without a second animated logo", () => {
  render(<SkeletonRows rows={3} />);
  expect(container.querySelector('[role="status"]')?.children).toHaveLength(3);
  expect(container.querySelector("svg")).toBeNull();
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
});
it("distinguishes signed-in data placeholders from the startup mark", () => {
  render(<LoadingRegion />);
  expect(container.querySelector("svg")).toBeNull();
  act(() => root.render(<LoadingStatus />));
  expect(container.querySelector("svg")).not.toBeNull();
});
