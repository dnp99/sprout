import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { EditTransactionForm } from "./EditTransactionForm";
import type { Transaction } from "@/lib/types";
const mocks = vi.hoisted(() => ({
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn(),
  done: vi.fn(),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) =>
    select({
      locale: "en-CA",
      categories: [{ id: "groceries", name: "Groceries", emoji: "🛒" }],
      businesses: [{ id: "studio", name: "Maple Studio" }],
      incomeSources: [{ id: "payroll", name: "Payroll" }],
      transactions: [],
      updateTransaction: mocks.update,
      deleteTransaction: mocks.remove,
    }),
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it.each(["expense", "income", "reimbursement"] as const)(
  "preserves %s accounting in the shared mobile editor",
  async (kind) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    const txn = {
      id: "record",
      merchant: "Maple Market",
      amountCents: kind === "expense" ? -1234 : 1234,
      isIncome: kind === "income",
      kind,
      categoryId: "groceries",
      businessId: "studio",
      incomeSourceId: kind === "income" ? "payroll" : null,
      note: "Sample note",
      excludeFromBudget: true,
      occurredAt: "2026-11-02T12:00:00Z",
      createdAt: "2026-11-02T12:00:00Z",
    } as Transaction;
    act(() => root.render(<EditTransactionForm txn={txn} onDone={mocks.done} sharedLayout />));
    expect(container.querySelector(".transaction-entry-form")).not.toBeNull();
    expect(
      container.querySelector('.transaction-entry-actions button[type="submit"]'),
    ).not.toBeNull();
    await act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(mocks.update).toHaveBeenCalledWith(
      "record",
      expect.objectContaining({
        amountCents: kind === "expense" ? -1234 : 1234,
        categoryId: kind === "income" ? null : "groceries",
        incomeSourceId: kind === "income" ? "payroll" : null,
        businessId: "studio",
        kind,
        excludeFromBudget: true,
        note: "Sample note",
      }),
    );
    expect(mocks.done).toHaveBeenCalledOnce();
  },
);

it.each([false, true])(
  "guides required merchant entry in the editor (shared: %s)",
  (sharedLayout) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    const txn = {
      id: "record",
      merchant: "",
      amountCents: -1234,
      isIncome: false,
      kind: "expense",
      categoryId: null,
      occurredAt: "2026-11-02T12:00:00Z",
      createdAt: "2026-11-02T12:00:00Z",
    } as Transaction;
    act(() =>
      root.render(
        <EditTransactionForm txn={txn} onDone={mocks.done} sharedLayout={sharedLayout} />,
      ),
    );
    const merchant = container.querySelector<HTMLInputElement>(
      'input[required][aria-invalid="true"]',
    )!;
    expect(merchant).not.toBeNull();
    expect(merchant.value).toBe("");
    // Existing records may remain uncategorized; guidance must not invent a new requirement.
    expect(container.querySelector('select[aria-invalid="true"]')).toBeNull();
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        merchant,
        "Maple Market",
      );
      merchant.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(merchant.getAttribute("aria-invalid")).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
  },
);
