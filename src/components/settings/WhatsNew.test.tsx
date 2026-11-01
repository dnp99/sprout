import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import messages from "@/messages/en-CA.json";
import { WhatsNewPrompt, WhatsNewCard } from "./WhatsNew";

const state = vi.hoisted(() => ({
  desktop: true,
  user: { id: "alex", whatsNewSeenVersion: 0 },
  acknowledgeRelease: vi.fn(),
  push: vi.fn(),
}));
vi.mock("@/hooks/useDesktop", () => ({ useDesktop: () => state.desktop }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({ push: state.push }),
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) =>
    select({ user: state.user, locale: "en-CA", acknowledgeRelease: state.acknowledgeRelease }),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    let value: unknown = messages.whatsNew;
    for (const part of key.split(".")) value = (value as Record<string, unknown>)[part];
    return String(value);
  },
}));

let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  state.desktop = true;
  state.user = { id: "alex", whatsNewSeenVersion: 0 };
  state.acknowledgeRelease.mockReset().mockImplementation(async () => {
    state.user = { ...state.user, whatsNewSeenVersion: 1 };
  });
  state.push.mockReset();
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
const render = (node = <WhatsNewPrompt />) => act(() => root.render(node));
const wait = () => act(() => vi.advanceTimersByTime(3000));
async function click(text: string) {
  await act(async () =>
    [...document.querySelectorAll("button")].find((b) => b.textContent === text)!.click(),
  );
}
it("offers after sign-in, waits for other dialogs, and acknowledges only on dismissal", async () => {
  const editor = document.createElement("div");
  editor.setAttribute("role", "dialog");
  document.body.append(editor);
  render();
  wait();
  expect(document.body.textContent).toBe("");
  editor.remove();
  wait();
  expect(document.body.textContent).toContain("Clearer group balances");
  expect(state.acknowledgeRelease).not.toHaveBeenCalled();
  await click("Got it");
  expect(state.acknowledgeRelease).toHaveBeenCalledWith(1);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  render();
  wait();
  expect(document.body.textContent).toBe("");
});
it("hides automatic updates on phones and for already acknowledged accounts", () => {
  state.desktop = false;
  render();
  wait();
  expect(document.body.textContent).toBe("");
  state.desktop = true;
  state.user.whatsNewSeenVersion = 1;
  render();
  wait();
  expect(document.body.textContent).toBe("");
});
it("retains the popup on acknowledgement failure and retries before following a link", async () => {
  state.acknowledgeRelease.mockRejectedValueOnce(new Error("Offline"));
  render();
  wait();
  await click("Explore groups");
  expect(document.querySelector('[role="alert"]')?.textContent).toContain("Could not save");
  expect(state.push).not.toHaveBeenCalled();
  await click("Explore groups");
  expect(state.push).toHaveBeenCalledWith("/groups");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
it("allows replay from Settings without resetting or resaving an acknowledgement", async () => {
  state.user.whatsNewSeenVersion = 1;
  render(<WhatsNewCard />);
  await click("View updates");
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  await click("Got it");
  expect(state.acknowledgeRelease).not.toHaveBeenCalled();
});
