import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useMeasuredContentFloor } from "./useMeasuredContentFloor";

let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("keeps empty views compact, preserves measured record height, and resets for changed data", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  let height = 24;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ height }) as DOMRect,
  );
  function Harness({ scope, view }: { scope: string; view: string }) {
    const { contentRef, minHeight } = useMeasuredContentFloor(scope, view);
    return (
      <section style={{ minHeight }}>
        <div ref={contentRef} />
      </section>
    );
  }
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const render = (scope: string, view: string) =>
    act(() => root.render(<Harness scope={scope} view={view} />));
  const floor = () => container.querySelector("section")!.style.minHeight;
  render("records-a", "today");
  expect(floor()).toBe("24px");
  height = 180;
  render("records-a", "recent");
  expect(floor()).toBe("180px");
  height = 24;
  render("records-a", "today");
  expect(floor()).toBe("180px");
  render("records-b", "today");
  expect(floor()).toBe("24px");
  height = 600;
  render("records-b", "recent");
  expect(floor()).toBe("280px");
});
