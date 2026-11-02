import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { VisualThemePicker } from "./VisualThemePicker";

const setVisualTheme = vi.fn();
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/state/store", () => ({
  useStore: (selector: (state: unknown) => unknown) =>
    selector({ visualTheme: "cozy", setVisualTheme }),
}));

it("offers all three palettes and dispatches Elegant without changing color mode", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() => root.render(<VisualThemePicker />));
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.map((button) => button.textContent)).toEqual(["vibrant", "cozy", "elegant"]);
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    act(() => buttons[2].click());
    expect(setVisualTheme).toHaveBeenCalledWith("elegant");
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
