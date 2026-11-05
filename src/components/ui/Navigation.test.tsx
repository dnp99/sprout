import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { Navigation, NavigationItem } from "./Navigation";
vi.mock("next/link", () => ({
  default: ({
    prefetch: _prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => <a {...props} />,
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function render(children: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(children));
}
it("keeps real link semantics and never activates routes on arrow focus", () => {
  const click = vi.fn();
  render(
    <Navigation layout="rail" shape="rounded" aria-label="Pages">
      <NavigationItem href="#home" active label="Overview" onClick={click} />
      <NavigationItem href="#transactions" active={false} label="Transactions" />
    </Navigation>,
  );
  const link = container.querySelector<HTMLAnchorElement>("a")!;
  expect(link.getAttribute("href")).toBe("#home");
  expect(link.getAttribute("aria-current")).toBe("page");
  act(() => {
    link.focus();
    link.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  });
  expect(document.activeElement).toBe(link);
  expect(click).not.toHaveBeenCalled();
  const modified = new MouseEvent("click", { ctrlKey: true, bubbles: true, cancelable: true });
  act(() => link.dispatchEvent(modified));
  expect(modified.defaultPrevented).toBe(false);
});
it("prevents disabled link activation and preserves labels for collapsed items", () => {
  const click = vi.fn();
  render(
    <Navigation layout="context" shape="pill" indicatorIndex={1}>
      <NavigationItem
        href="#home"
        active={false}
        collapsed
        label="Personal"
        aria-disabled
        onClick={click}
        icon={<svg />}
      />
      <NavigationItem href="/groups" active label="Groups" />
    </Navigation>,
  );
  const link = container.querySelector<HTMLAnchorElement>("a")!;
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  act(() => link.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
  expect(click).not.toHaveBeenCalled();
  expect(link.getAttribute("aria-label")).toBe("Personal");
  expect(link.title).toBe("Personal");
  expect(container.querySelectorAll(".choice-indicator")).toHaveLength(1);
  expect(container.querySelector('[role="tab"]')).toBeNull();
});
