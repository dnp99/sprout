import { useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { TransactionEntryFields, TransactionEntryForm } from "./TransactionEntryForm";
import { appendAmountKey } from "@/lib/amount-entry";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/state/store", () => ({
  useStore: (selector: (state: { locale: string }) => unknown) => selector({ locale: "en-CA" }),
}));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
function render(node: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(node));
}
it.each(["Personal space", "Group · Maple House"])(
  "uses the same cents keypad and keyboard entry in %s",
  (context) => {
    function Draft() {
      const [cents, setCents] = useState(0);
      return (
        <TransactionEntryForm onSubmit={vi.fn()} disabled busy={false}>
          <TransactionEntryFields
            context={context}
            amountCents={cents}
            income={false}
            onAmountKey={(key) => setCents((value) => appendAmountKey(value, key))}
            onAmountChange={setCents}
            merchant=""
            onMerchantChange={vi.fn()}
            date="2026-11-02"
            onDateChange={vi.fn()}
            categoryId=""
            onCategoryChange={vi.fn()}
            categories={[{ id: "food", name: "Food" }]}
            note=""
            onNoteChange={vi.fn()}
            mode="expense"
          />
        </TransactionEntryForm>
      );
    }
    render(<Draft />);
    const click = (text: string) =>
      act(() =>
        [...container.querySelectorAll("button")]
          .find((button) => button.textContent === text)!
          .click(),
      );
    expect(container.querySelector<HTMLInputElement>('input[aria-label="amount"]')?.inputMode).toBe(
      "numeric",
    );
    expect(
      [...container.querySelectorAll("button")].some((button) => button.textContent === "00"),
    ).toBe(false);
    click("showKeypad");
    for (const digit of ["1", "2", "3", "00", "⌫"]) click(digit);
    const amount = container.querySelector<HTMLInputElement>('input[aria-label="amount"]')!;
    expect(amount.value).toBe("$12.30");
    expect(amount.inputMode).toBe("none");
    act(() => {
      amount.dispatchEvent(new KeyboardEvent("keydown", { key: "5", bubbles: true }));
    });
    expect(amount.value).toBe("$123.05");
    click("hideKeypad");
    expect(
      [...container.querySelectorAll("button")].some((button) => button.textContent === "00"),
    ).toBe(false);
    expect(amount.inputMode).toBe("numeric");
    click("showKeypad");
    expect(amount.value).toBe("$123.05");
    expect(container.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe(
      "2026-11-02",
    );
    expect(container.querySelector('select[aria-label="category"]')?.hasAttribute("required")).toBe(
      true,
    );
  },
);

it("marks required fields after a submit attempt and clears outlines/messages on correction", () => {
  function Draft() {
    const [cents, setCents] = useState(0);
    const [category, setCategory] = useState("");
    return (
      <TransactionEntryForm onSubmit={vi.fn()} disabled busy={false}>
        <TransactionEntryFields
          context="Personal space"
          amountCents={cents}
          income={false}
          onAmountKey={(key) => setCents((value) => appendAmountKey(value, key))}
          onAmountChange={setCents}
          merchant=""
          onMerchantChange={vi.fn()}
          date="2026-11-02"
          onDateChange={vi.fn()}
          categoryId={category}
          onCategoryChange={setCategory}
          categories={[{ id: "food", name: "Food" }]}
          note=""
          onNoteChange={vi.fn()}
          mode="expense"
        />
      </TransactionEntryForm>
    );
  }
  render(<Draft />);
  const amount = container.querySelector<HTMLInputElement>('input[aria-label="amount"]')!;
  const category = container.querySelector<HTMLSelectElement>('select[aria-label="category"]')!;
  expect(amount.getAttribute("aria-invalid")).toBeNull();
  expect(category.getAttribute("aria-invalid")).toBeNull();
  expect(container.textContent).not.toContain("hint");
  expect(category.closest("label")?.querySelector("span")?.textContent).toContain("*");
  act(() => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(amount.getAttribute("aria-invalid")).toBe("true");
  expect(category.getAttribute("aria-invalid")).toBe("true");
  expect(amount.closest(".transaction-amount-field")?.getAttribute("data-invalid")).toBe("true");
  expect(document.getElementById(amount.getAttribute("aria-describedby")!)?.textContent).toBe(
    "amountRequired",
  );
  expect(document.getElementById(category.getAttribute("aria-describedby")!)?.textContent).toBe(
    "categoryRequired",
  );
  act(() => {
    container
      .querySelector<HTMLInputElement>('input[aria-label="amount"]')!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true }));
    category.value = "food";
    category.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(amount.getAttribute("aria-invalid")).toBeNull();
  expect(category.getAttribute("aria-invalid")).toBeNull();
  expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0);
});

it("shows a category error on blur while leaving an untouched amount neutral", () => {
  render(
    <TransactionEntryFields
      context="Group · Maple House"
      amountCents={0}
      income={false}
      onAmountKey={vi.fn()}
      onAmountChange={vi.fn()}
      merchant=""
      onMerchantChange={vi.fn()}
      date="2026-11-02"
      onDateChange={vi.fn()}
      categoryId=""
      onCategoryChange={vi.fn()}
      categories={[{ id: "food", name: "Food" }]}
      note=""
      onNoteChange={vi.fn()}
      mode="expense"
    />,
  );
  const category = container.querySelector<HTMLSelectElement>('select[aria-label="category"]')!;
  act(() => {
    category.dispatchEvent(
      new FocusEvent("focusout", {
        bubbles: true,
        relatedTarget: container.querySelector("textarea"),
      }),
    );
  });
  expect(category.getAttribute("aria-invalid")).toBe("true");
  expect(
    container.querySelector('input[aria-label="amount"]')?.getAttribute("aria-invalid"),
  ).toBeNull();
});
