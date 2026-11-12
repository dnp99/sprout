import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TransactionFilterControl } from "./TransactionFilterControl";
import { emptyFilterDraft, type FilterDraft } from "@/lib/transactions/filter-draft";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/hooks/useDesktop", () => ({ useDesktop: () => true }));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({
    locale: "en-CA",
    money: (value: number) => String(value),
    monthKey: (value: string) => value,
  }),
}));
const committed = vi.fn();
function Harness() {
  const [personal, setPersonal] = useState<FilterDraft>({
    ...emptyFilterDraft,
    categories: ["housing"],
    sort: "amount:asc",
  });
  const [group, setGroup] = useState<FilterDraft>({ ...emptyFilterDraft, payer: "alex" });
  return (
    <>
      {(["personal", "group"] as const).map((ledger) => (
        <section key={ledger} data-ledger-context={ledger}>
          <TransactionFilterControl
            query="unchanged"
            onQueryChange={vi.fn()}
            applied={ledger === "personal" ? personal : group}
            onApply={(draft) => {
              committed(ledger, draft);
              (ledger === "personal" ? setPersonal : setGroup)(draft);
            }}
            config={{
              month: "2026-10",
              multipleCategories: true,
              categories: [
                { value: "housing", label: "Housing" },
                { value: "food", label: "Food" },
              ],
              payers:
                ledger === "group"
                  ? [
                      { value: "", label: "All members" },
                      { value: "alex", label: "Alex" },
                    ]
                  : undefined,
              sorts: [
                { value: "date:desc", label: "Newest" },
                { value: "amount:asc", label: "Lowest" },
              ],
              quick: [
                { value: "refund", label: "Refunds" },
                { value: "uncategorized", label: "Uncategorized" },
              ],
            }}
          />
        </section>
      ))}
    </>
  );
}
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
    { width: 44 },
  ] as unknown as DOMRectList);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  committed.mockClear();
});
const open = (ledger = "personal") =>
  act(() =>
    container
      .querySelector<HTMLButtonElement>(
        `[data-ledger-context="${ledger}"] button[aria-haspopup="dialog"]`,
      )!
      .click(),
  );
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const apply = () =>
  act(() => dialog().querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
const escape = () =>
  act(() =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    ),
  );
it("discards edits on Escape, restores focus, and resets only on Apply", () => {
  open();
  expect(dialog().querySelector('[aria-label="paidBy"]')).toBeNull();
  act(() => dialog().querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
  expect(committed).not.toHaveBeenCalled();
  escape();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(container.querySelector('[aria-haspopup="dialog"]'));
  open();
  expect(dialog().querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
  const reset = [...dialog().querySelectorAll("button")].find(
    (b) => b.textContent === "resetFilters",
  )!;
  act(() => reset.click());
  expect(committed).not.toHaveBeenCalled();
  apply();
  expect(committed).toHaveBeenLastCalledWith(
    "personal",
    expect.objectContaining({ categories: [], sort: "date:desc" }),
  );
  expect(container.querySelector('[data-ledger-context="group"]')!.textContent).toContain("Alex");
});
it("commits multiple edits once and removes applied chips immediately", () => {
  open();
  act(() => dialog().querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[1].click());
  act(() => dialog().querySelector<HTMLInputElement>('[role="switch"]')!.click());
  expect(committed).not.toHaveBeenCalled();
  apply();
  expect(committed).toHaveBeenCalledOnce();
  expect(committed).toHaveBeenLastCalledWith(
    "personal",
    expect.objectContaining({
      categories: ["housing", "food"],
      quick: "refund",
      sort: "amount:asc",
    }),
  );
  const chips = container.querySelector('[data-ledger-context="personal"]')!;
  act(() =>
    [...chips.querySelectorAll("button")].find((b) => b.textContent?.includes("Refunds"))!.click(),
  );
  expect(committed).toHaveBeenLastCalledWith(
    "personal",
    expect.objectContaining({ quick: "", categories: ["housing", "food"] }),
  );
});
it("keeps nested Select interaction and first Escape inside the filter dialog", () => {
  open("group");
  const payer = dialog().querySelector<HTMLButtonElement>('[aria-label="paidBy"]')!;
  act(() => payer.click());
  expect(dialog().querySelector('[role="listbox"]')).not.toBeNull();
  act(() =>
    payer.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    ),
  );
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  expect(dialog().querySelector('[role="listbox"]')).toBeNull();
  expect(committed).not.toHaveBeenCalled();
  escape();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

it("prevents invalid amount bounds from reaching the applied ledger", () => {
  open();
  const setText = (label: string, value: string) =>
    act(() => {
      const input = dialog().querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  setText("min", "20.50");
  setText("max", "10");
  expect(dialog().querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  expect(dialog().querySelector('[role="alert"]')).not.toBeNull();
  act(() =>
    dialog()
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(committed).not.toHaveBeenCalled();
  setText("max", "30.75");
  apply();
  expect(committed).toHaveBeenLastCalledWith(
    "personal",
    expect.objectContaining({ min: "20.50", max: "30.75" }),
  );
});

it("traps Tab and discards edits on an outside click", () => {
  open();
  act(() => dialog().querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
  const submit = dialog().querySelector<HTMLButtonElement>('button[type="submit"]')!;
  act(() => submit.focus());
  act(() =>
    submit.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
    ),
  );
  expect(document.activeElement).toBe(dialog().querySelector('[aria-label="close"]'));
  act(() => document.querySelector<HTMLElement>(".transaction-filter-overlay")!.click());
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(committed).not.toHaveBeenCalled();
  open();
  expect(dialog().querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
});
