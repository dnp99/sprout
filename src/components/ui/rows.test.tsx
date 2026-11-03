import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { TransactionCard } from "./rows";
import type { Transaction } from "@/lib/types";
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) => select({ locale: "en-CA" }),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({ money: () => "$12.34", txnDate: () => "Today" }),
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
it("keeps the row and trailing action as separate buttons", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const open = vi.fn(),
    action = vi.fn(),
    toggle = vi.fn();
  const txn = {
    id: "row",
    merchant: "Maple Market",
    amountCents: -1234,
    categoryName: "Groceries",
    emoji: "🛒",
    occurredAt: "2026-11-03T12:00:00Z",
  } as Transaction;
  act(() =>
    root.render(
      <TransactionCard
        txn={txn}
        onClick={open}
        onToggle={toggle}
        actions={<button onClick={action}>Actions</button>}
      />,
    ),
  );
  const buttons = container.querySelectorAll("button");
  expect(buttons).toHaveLength(2);
  act(() => buttons[1].click());
  expect(action).toHaveBeenCalledOnce();
  expect(open).not.toHaveBeenCalled();
  act(() => buttons[0].click());
  expect(open).toHaveBeenCalledOnce();
  act(() =>
    root.render(
      <TransactionCard
        txn={txn}
        onClick={open}
        onToggle={toggle}
        selectable
        actions={<button>Actions</button>}
      />,
    ),
  );
  expect(container.textContent).not.toContain("Actions");
  act(() => container.querySelector("button")!.click());
  expect(toggle).toHaveBeenCalledOnce();
});
