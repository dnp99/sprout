import { useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import {
  TransactionDialog,
  TransactionEntryFields,
  TransactionEntryForm,
} from "./TransactionEntryForm";
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
it.each(
  [false, true].flatMap((desktop) =>
    ["Personal space", "Group · Maple House"].map((context) => ({ desktop, context })),
  ),
)("uses compact native amount entry in $context (desktop: $desktop)", ({ context, desktop }) => {
  vi.stubGlobal("matchMedia", () => ({
    matches: desktop,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
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
  const amount = container.querySelector<HTMLInputElement>('input[aria-label="amount"]')!;
  expect(amount.inputMode).toBe("numeric");
  expect(amount.classList.contains("opacity-0")).toBe(false);
  expect(container.textContent).not.toContain("showKeypad");
  expect(container.textContent).not.toContain("nextMerchant");
  for (const key of ["1", "2", "3", "0", "back", "5"])
    act(() =>
      amount.dispatchEvent(
        new KeyboardEvent("keydown", { key: key === "back" ? "Backspace" : key, bubbles: true }),
      ),
    );
  expect(amount.value).toBe("$12.35");
  expect(container.querySelectorAll('input[aria-label="amount"]')).toHaveLength(1);
  expect(container.querySelector<HTMLDetailsElement>(".transaction-more-details")?.open).toBe(
    false,
  );
});

it.each([undefined, "Maple House"])("keeps mobile Save in the sheet header for %s", (groupName) => {
  const submit = vi.fn();
  render(
    <TransactionDialog groupName={groupName} onClose={vi.fn()}>
      <TransactionEntryForm onSubmit={submit} disabled={false} busy={false}>
        <input aria-label="merchant" defaultValue="Market" required />
      </TransactionEntryForm>
    </TransactionDialog>,
  );
  const save = container.querySelector<HTMLButtonElement>(
    ".transaction-mobile-header-action button",
  )!;
  expect(save).not.toBeNull();
  expect(save.form).toBe(container.querySelector("form"));
  expect(container.querySelector(".transaction-entry-scroll")?.contains(save)).toBe(false);
  act(() => save.click());
  expect(submit).toHaveBeenCalledOnce();
});

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

it.each([false, true])(
  "keeps mobile Save in the scroll flow and desktop Save separate (desktop: %s)",
  (desktop) => {
    vi.stubGlobal("matchMedia", () => ({
      matches: desktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(
      <TransactionEntryForm onSubmit={vi.fn()} disabled={false} busy={false}>
        <input aria-label="Merchant" />
        <textarea aria-label="Note" />
      </TransactionEntryForm>,
    );
    const fields = container.querySelector(".transaction-entry-scroll")!;
    const actions = container.querySelector(".transaction-entry-actions")!;
    expect(fields.contains(container.querySelector("input"))).toBe(true);
    expect(fields.contains(container.querySelector("textarea"))).toBe(true);
    expect(fields.contains(actions)).toBe(!desktop);
    expect(actions.parentElement).toBe(desktop ? fields.parentElement : fields);
    expect(actions.querySelector('button[type="submit"]')).not.toBeNull();
  },
);

it.each(["keyboard", "keypad", "calculator"])(
  "reveals missing required fields as soon as an amount is entered with the %s",
  (method) => {
    if (method === "keypad")
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query.includes("1024"),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
    function Draft() {
      const [cents, setCents] = useState(0);
      const [merchant, setMerchant] = useState("");
      const [date, setDate] = useState("");
      const [category, setCategory] = useState("");
      return (
        <TransactionEntryForm onSubmit={vi.fn()} disabled busy={false}>
          <TransactionEntryFields
            amountCents={cents}
            income={false}
            onAmountKey={(key) => setCents((value) => appendAmountKey(value, key))}
            onAmountChange={setCents}
            merchant={merchant}
            merchantRequired
            onMerchantChange={setMerchant}
            date={date}
            onDateChange={setDate}
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
    const click = (text: string) =>
      act(() => {
        [...container.querySelectorAll("button")]
          .find((button) => button.textContent === text)!
          .click();
      });
    const amount = container.querySelector<HTMLInputElement>('input[aria-label="amount"]')!;
    // Modal autofocus is not an attempt to fill the draft.
    expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
    if (method === "keyboard") {
      act(() => amount.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true })));
    } else if (method === "keypad") {
      click("showKeypad");
      click("1");
    } else {
      click("title");
      click("1");
      click("= apply");
    }
    const merchant = container.querySelector<HTMLInputElement>('input[maxlength="120"]')!;
    const date = container.querySelector<HTMLInputElement>('input[type="date"]')!;
    const category = container.querySelector<HTMLSelectElement>('select[aria-label="category"]')!;
    for (const field of [merchant, date, category])
      expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(amount.getAttribute("aria-invalid")).toBeNull();
    const fill = (input: HTMLInputElement, value: string) =>
      act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          input,
          value,
        );
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    fill(merchant, "Maple Market");
    fill(date, "2026-11-03");
    act(() => {
      category.value = "food";
      category.dispatchEvent(new Event("change", { bubbles: true }));
    });
    for (const field of [merchant, date, category])
      expect(field.getAttribute("aria-invalid")).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  },
);

it("keeps optional merchant and category fields neutral after entering an amount", () => {
  render(
    <TransactionEntryFields
      amountCents={1234}
      income={false}
      onAmountKey={vi.fn()}
      onAmountChange={vi.fn()}
      merchant=""
      onMerchantChange={vi.fn()}
      date="2026-11-03"
      onDateChange={vi.fn()}
      categoryId=""
      onCategoryChange={vi.fn()}
      categories={[]}
      categoryRequired={false}
      note=""
      onNoteChange={vi.fn()}
      mode="expense"
    />,
  );
  expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
});

it.each(
  [false, true].flatMap((desktop) =>
    [false, true].map((missingDate) => ({ desktop, missingDate })),
  ),
)(
  "advances required fields without submitting (desktop: $desktop, missing date: $missingDate)",
  ({ desktop, missingDate }) => {
    vi.stubGlobal("matchMedia", () => ({
      matches: desktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const submit = vi.fn();
    function Draft() {
      const [cents, setCents] = useState(0);
      const [merchant, setMerchant] = useState("");
      const [date, setDate] = useState(missingDate ? "" : "2026-11-04");
      return (
        <TransactionEntryForm onSubmit={submit} disabled busy={false}>
          <TransactionEntryFields
            amountCents={cents}
            income={false}
            onAmountKey={(key) => setCents((value) => appendAmountKey(value, key))}
            onAmountChange={setCents}
            merchant={merchant}
            merchantRequired
            onMerchantChange={setMerchant}
            date={date}
            onDateChange={setDate}
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
    const amount = container.querySelector<HTMLInputElement>('input[aria-label="amount"]')!;
    const merchant = container.querySelector<HTMLInputElement>('input[maxlength="120"]')!;
    const category = container.querySelector<HTMLSelectElement>('select[aria-label="category"]')!;
    const press = (field: HTMLElement, key: string, isComposing = false) => {
      const event = new KeyboardEvent("keydown", {
        key,
        isComposing,
        bubbles: true,
        cancelable: true,
      });
      act(() => field.dispatchEvent(event));
      return event;
    };
    press(amount, "1");
    expect(press(amount, "Enter").defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(merchant);
    press(merchant, "Enter");
    expect(document.activeElement).toBe(merchant);
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        merchant,
        "Maple Market",
      );
      merchant.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(press(merchant, "Enter", true).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(merchant);
    const clicked = vi.fn();
    category.addEventListener("click", clicked);
    expect(press(merchant, "Enter").defaultPrevented).toBe(true);
    if (missingDate) {
      const date = container.querySelector<HTMLInputElement>('input[type="date"]')!;
      expect(document.activeElement).toBe(date);
      expect(press(date, "Enter").defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(date);
      act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          date,
          "2026-11-04",
        );
        date.dispatchEvent(new Event("input", { bubbles: true }));
      });
      press(date, "Enter");
    }
    expect(document.activeElement).toBe(category);
    expect(clicked).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  },
);
