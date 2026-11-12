import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { name?: string }) =>
    key === "selectParent" ? `${values?.name} only` : key,
}));
vi.mock("@/hooks/useModalFocus", () => ({ useModalFocus: () => {} }));
import { TransactionCategoryPicker } from "./TransactionCategoryPicker";
let host: HTMLDivElement, root: ReturnType<typeof createRoot>;
const change = vi.fn();
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  change.mockReset();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const render = () =>
  act(() =>
    root.render(
      <TransactionCategoryPicker
        categories={[
          { id: "housing", name: "Housing" },
          { id: "rent", name: "Rent", parentId: "housing" },
          { id: "food", name: "Food" },
        ]}
        value=""
        onChange={change}
        label="Category"
        placeholder="Choose"
        required
        disabled={false}
        invalid={false}
        className=""
      />,
    ),
  );
it("opens a dialog with collapsed children and allows choosing a child", () => {
  render();
  act(() => host.querySelector("button")!.click());
  const dialog = document.querySelector('[role="dialog"]')!;
  expect(dialog.textContent).toContain("Housing");
  expect(dialog.textContent).not.toContain("Rent");
  expect(change).not.toHaveBeenCalled();
  act(() => dialog.querySelector<HTMLButtonElement>('[aria-expanded="false"]')!.click());
  const rent = Array.from(dialog.querySelectorAll("button")).find((b) => b.textContent === "Rent")!;
  act(() => rent.click());
  expect(change).toHaveBeenCalledWith("rent");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
it("closing the drawer leaves the existing value unchanged", () => {
  render();
  act(() => host.querySelector("button")!.click());
  act(() => document.querySelector<HTMLButtonElement>('[aria-label="close"]')!.click());
  expect(change).not.toHaveBeenCalled();
});
it("searches children without expanding parents and retains their path", () => {
  render();
  act(() => host.querySelector("button")!.click());
  const input = document.querySelector<HTMLInputElement>('input[type="search"]')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "rent");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const dialog = document.querySelector('[role="dialog"]')!;
  expect(dialog.textContent).toContain("Housing / Rent");
  expect(dialog.textContent).not.toContain("Food");
});
it("uses a bounded anchored popover without a drawer backdrop on desktop", () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  render();
  act(() => host.querySelector("button")!.click());
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  expect(dialog.style.width).toBe("340px");
  expect(dialog.style.maxHeight).toBe("360px");
  expect(dialog.parentElement?.classList.contains("modal-backdrop")).toBe(false);
  expect(dialog.querySelector("input")?.hasAttribute("data-initial-focus")).toBe(true);
});

it("opens a parent from its label and selects it only through the option inside", () => {
  render();
  act(() => host.querySelector("button")!.click());
  const dialog = document.querySelector('[role="dialog"]')!;
  const branch = dialog.querySelector<HTMLButtonElement>("[data-category-branch]")!;
  act(() => branch.querySelector("span")!.click());
  expect(branch.getAttribute("aria-expanded")).toBe("true");
  expect(change).not.toHaveBeenCalled();
  const parentChoice = [...dialog.querySelectorAll("button")].find(
    (button) => button.textContent === "Housing only",
  )!;
  act(() => parentChoice.click());
  expect(change).toHaveBeenCalledWith("housing");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
