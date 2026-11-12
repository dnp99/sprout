import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { FilterScrollHint } from "./FilterScrollHint";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
it("reveals overflow, hides at the bottom, and reacts to content and viewport changes", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  let notify = () => {};
  const observe = vi.fn(),
    disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  function Harness() {
    const ref = useRef<HTMLDivElement>(null);
    return (
      <>
        <div ref={ref} data-scroll>
          <div>Filter fields</div>
        </div>
        <FilterScrollHint scrollRef={ref} />
      </>
    );
  }
  try {
    act(() => root.render(<Harness />));
    const region = host.querySelector<HTMLElement>("[data-scroll]")!;
    expect(host.textContent).not.toContain("moreFiltersBelow");
    let available = 200,
      content = 600;
    Object.defineProperties(region, {
      clientHeight: { get: () => available },
      scrollHeight: { get: () => content },
    });
    act(() => window.dispatchEvent(new Event("resize")));
    expect(host.textContent).toContain("moreFiltersBelow");
    expect(observe).toHaveBeenCalledWith(region);
    expect(observe).toHaveBeenCalledWith(region.firstElementChild);
    act(() => {
      region.scrollTop = 400;
      region.dispatchEvent(new Event("scroll"));
    });
    expect(host.textContent).not.toContain("moreFiltersBelow");
    // Revealing extra fields must restore the cue without a window resize.
    act(() => {
      content = 800;
      notify();
    });
    expect(host.textContent).toContain("moreFiltersBelow");
    act(() => {
      available = 1000;
      notify();
    });
    expect(host.textContent).not.toContain("moreFiltersBelow");
    act(() => root.unmount());
    expect(disconnect).toHaveBeenCalledOnce();
  } finally {
    host.remove();
    vi.unstubAllGlobals();
  }
});
