import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { PwaInstallState } from "@/lib/pwa/install-controller";
import * as offer from "@/lib/pwa/install-offer";
import { PwaSignInPrompt } from "./PwaSignInPrompt";

const capability = vi.hoisted(() => ({ state: { status: "unavailable" } as PwaInstallState }));
vi.mock("@/hooks/usePwaInstall", () => ({ usePwaInstall: () => capability.state }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(offer, "claimInstallOffer").mockReturnValue(true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const render = () => act(() => root.render(<PwaSignInPrompt />));
const wait = () => act(() => vi.advanceTimersByTime(3000));
function click(label: string) {
  act(() =>
    [...container.querySelectorAll("button")]
      .find((b) => b.textContent === label || b.getAttribute("aria-label") === label)!
      .click(),
  );
}
it("waits for capability, delays the offer, and installs only after a user click", async () => {
  capability.state = { status: "unavailable" };
  render();
  wait();
  expect(container.textContent).toBe("");
  const install = vi.fn().mockResolvedValue("accepted");
  capability.state = { status: "prompt-ready", platform: "browser", install };
  render();
  expect(container.textContent).toBe("");
  wait();
  expect(container.textContent).toContain("notNow");
  expect(install).not.toHaveBeenCalled();
  await act(async () => click("install"));
  expect(install).toHaveBeenCalledTimes(1);
  capability.state = { status: "installed" };
  render();
  expect(container.textContent).toBe("");
});
it("offers platform instructions and dismisses without affecting the ledger", () => {
  capability.state = { status: "instructions", platform: "ios" };
  render();
  wait();
  click("howToInstall");
  expect(container.textContent).toContain("iosInstructions");
  click("close");
  click("notNow");
  expect(container.textContent).toBe("");
});
it("respects the offer pause and hides generic guidance without native capability", () => {
  vi.mocked(offer.claimInstallOffer).mockReturnValue(false);
  capability.state = { status: "prompt-ready", platform: "browser", install: vi.fn() };
  render();
  wait();
  expect(container.textContent).toBe("");
  capability.state = { status: "instructions", platform: "browser" };
  render();
  wait();
  expect(container.textContent).toBe("");
});
