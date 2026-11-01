import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { AccountHeader } from "./AccountHeader";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) =>
    select({ user: { name: "Alex", greetingName: "Alex" } }),
}));
vi.mock("@/components/settings/AccountSettings", () => ({
  AccountSettings: () => <div>account-preferences</div>,
}));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
it("opens account settings locally from the avatar without replacing the ledger", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <section data-ledger-context="group">
        <AccountHeader />
        <p>group-workspace</p>
      </section>,
    ),
  );
  act(() =>
    container.querySelector<HTMLButtonElement>('button[aria-label="titles.settings"]')!.click(),
  );
  expect(container.querySelector('[role="dialog"]')?.textContent).toContain("account-preferences");
  expect(container.textContent).toContain("group-workspace");
  act(() => container.querySelector<HTMLButtonElement>('button[aria-label="close"]')!.click());
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});
