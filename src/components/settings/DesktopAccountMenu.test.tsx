import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { DesktopAccountMenu } from "./DesktopAccountMenu";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("./AccountSettings", () => ({
  AccountSettings: ({ section }: { section: string }) => <p>{section}-panel</p>,
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function render(compact = false) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<DesktopAccountMenu compact={compact} />));
  return container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!;
}
it("offers account sections and the existing logout route, including in a collapsed rail", () => {
  const trigger = render(true);
  act(() => trigger.click());
  const items = container.querySelectorAll<HTMLElement>('[role="menuitem"]');
  expect(items).toHaveLength(5);
  expect(document.activeElement).toBe(items[0]);
  expect(items[4].getAttribute("href")).toBe("/logout");
  act(() => items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true })));
  expect(document.activeElement).toBe(items[4]);
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(container.querySelector('[role="menu"]')).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
it("opens the selected account panel and returns focus without ledger navigation", () => {
  const trigger = render();
  act(() => trigger.click());
  act(() => container.querySelector<HTMLButtonElement>('[role="menuitem"]')!.click());
  expect(container.querySelector('[role="dialog"]')?.textContent).toContain("profile-panel");
  expect(container.querySelector('[role="menu"]')).toBeNull();
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="close"]')!.click());
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
