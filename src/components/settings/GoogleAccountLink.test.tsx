import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
import { GoogleAccountLink } from "./GoogleAccountLink";
let container: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
it.each([true, false])(
  "shows the current linked state without submitting account changes (%s)",
  async (linked) => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ enabled: true, linked }) });
    vi.stubGlobal("fetch", fetch);
    await act(async () => root.render(<GoogleAccountLink />));
    expect(!!container.querySelector("form")).toBe(!linked);
    expect(!!container.querySelector('[role="status"]')).toBe(linked);
    if (!linked) {
      expect(container.querySelector('input[type="password"]')?.getAttribute("autocomplete")).toBe(
        "current-password",
      );
      expect(container.querySelector("button")?.disabled).toBe(true);
    }
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][1].method).toBeUndefined();
  },
);
it("does not expose a broken link control when Google is unavailable", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled: false, linked: false }) }),
  );
  await act(async () => root.render(<GoogleAccountLink />));
  expect(container.textContent).toBe("");
});
