import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { AccountHeader } from "./AccountHeader";
import { TransactionSpaceBadge } from "./TransactionSpaceBadge";
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
it("replaces only the Transactions greeting with a bounded ledger identity and keeps account access", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <AccountHeader
        transactionContext={
          <TransactionSpaceBadge group name="Maple House with a long shared name" />
        }
      />,
    ),
  );
  expect(container.querySelector("h1")?.textContent).toBe("nav.transactions");
  expect(container.querySelector(".account-greeting")).toBeNull();
  expect(container.querySelector(".transaction-space-badge")?.getAttribute("title")).toBe(
    "Maple House with a long shared name",
  );
  act(() =>
    container.querySelector<HTMLButtonElement>('button[aria-label="titles.settings"]')!.click(),
  );
  expect(container.querySelector('[role="dialog"]')?.textContent).toContain("account-preferences");
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
