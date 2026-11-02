import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useModalFocus } from "./useModalFocus";

it("focuses the nominated input instead of Close and restores the opener", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const rects = vi
    .spyOn(HTMLElement.prototype, "getClientRects")
    .mockReturnValue([{}] as DOMRectList);
  const opener = document.createElement("button");
  const container = document.createElement("div");
  document.body.append(opener, container);
  opener.focus();
  const root = createRoot(container);
  function Dialog() {
    const ref = useRef<HTMLDivElement>(null);
    useModalFocus(ref, () => {});
    return (
      <div ref={ref}>
        <button>Close</button>
        <input data-initial-focus aria-label="Amount" />
      </div>
    );
  }
  try {
    act(() => root.render(<Dialog />));
    expect(document.activeElement).toBe(container.querySelector("input"));
    act(() => root.unmount());
    expect(document.activeElement).toBe(opener);
  } finally {
    container.remove();
    opener.remove();
    rects.mockRestore();
    vi.unstubAllGlobals();
  }
});
