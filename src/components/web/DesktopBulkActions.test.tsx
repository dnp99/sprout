import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { Transaction } from "@/lib/types";
import { DesktopBulkActions } from "./DesktopBulkActions";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
it("labels the destructive menu item and confirms even a single deletion without deleting on cancel", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const remove = vi.fn();
  act(() =>
    root.render(
      <DesktopBulkActions
        selectedTransactions={[
          { id: "a", amountCents: -100, isIncome: false, categoryId: null } as Transaction,
        ]}
        categories={[]}
        incomeSources={[]}
        onCategorize={vi.fn()}
        onSetIncomeSource={vi.fn()}
        onExclude={vi.fn()}
        onInclude={vi.fn()}
        onDelete={remove}
        onClear={vi.fn()}
      />,
    ),
  );
  const click = (text: string) =>
    act(() =>
      [...document.querySelectorAll<HTMLButtonElement>("button")]
        .find((b) => b.textContent?.trim() === text)!
        .click(),
    );
  click("more");
  expect(container.querySelector("[data-destructive-action]")?.textContent).toBe("delete");
  click("delete");
  expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
  expect(remove).not.toHaveBeenCalled();
  click("cancel");
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  expect(remove).not.toHaveBeenCalled();
});
