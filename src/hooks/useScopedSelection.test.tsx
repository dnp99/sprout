import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useScopedSelection } from "./useScopedSelection";
it("permanently clears bulk selections when changing businesses, including a round trip", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  function Harness({ scope }: { scope: string }) {
    const [ids, setIds] = useScopedSelection(scope);
    return <button onClick={() => setIds(new Set(["private-row"]))}>{ids.size}</button>;
  }
  try {
    act(() => root.render(<Harness scope="maple" />));
    act(() => container.querySelector("button")!.click());
    expect(container.textContent).toBe("1");
    act(() => root.render(<Harness scope="other" />));
    expect(container.textContent).toBe("0");
    act(() => root.render(<Harness scope="maple" />));
    expect(container.textContent).toBe("0");
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
