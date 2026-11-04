import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useTransactionFieldVisibility } from "./useTransactionFieldVisibility";

it("reveals a focused merchant after keyboard resize without scrolling the page", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const frames = new Map<number, FrameRequestCallback>();
  let next = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++next, callback);
    return next;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  const viewport = new EventTarget();
  vi.stubGlobal("visualViewport", viewport);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  function Draft() {
    const ref = useRef<HTMLDivElement>(null);
    useTransactionFieldVisibility(ref);
    return (
      <div ref={ref}>
        <input aria-label="Merchant" />
      </div>
    );
  }
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  };
  try {
    act(() => root.render(<Draft />));
    const region = host.firstElementChild as HTMLDivElement;
    const merchant = host.querySelector("input")!;
    let bottom = 340;
    vi.spyOn(region, "getBoundingClientRect").mockImplementation(
      () => ({ top: 100, bottom }) as DOMRect,
    );
    vi.spyOn(merchant, "getBoundingClientRect").mockImplementation(
      () => ({ top: 400 - region.scrollTop, bottom: 444 - region.scrollTop }) as DOMRect,
    );
    merchant.focus();
    flush();
    expect(region.scrollTop).toBe(116);
    bottom = 220;
    viewport.dispatchEvent(new Event("resize"));
    flush();
    expect(region.scrollTop).toBe(236);
    expect(merchant.getBoundingClientRect().bottom).toBeLessThanOrEqual(bottom - 12);
    act(() => root.unmount());
    viewport.dispatchEvent(new Event("resize"));
    expect(frames.size).toBe(0);
  } finally {
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});
