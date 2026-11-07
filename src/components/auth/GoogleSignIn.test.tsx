import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const params = vi.hoisted(() => ({ error: null as string | null }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({ useSearchParams: () => ({ get: () => params.error }) }));
import { GoogleSignIn } from "./GoogleSignIn";
let container: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  root = createRoot(container);
  params.error = null;
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
it.each([true, false])("exposes Google sign-in only when configured (%s)", async (enabled) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled }) }));
  await act(async () => root.render(<GoogleSignIn />));
  if (enabled)
    expect(container.querySelector("img")?.getAttribute("src")).toContain("google-logo.png");
  expect(!!container.querySelector('a[href="/api/auth/google/start"]')).toBe(enabled);
});
it("shows a useful collision error without reflecting arbitrary provider text", async () => {
  params.error = "existing";
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  await act(async () => root.render(<GoogleSignIn />));
  expect(container.querySelector('[role="alert"]')?.textContent?.trim()).toBe("googleExisting");
});
