import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { name?: string }) =>
    key === "selectParent" ? `Select ${values?.name}` : key,
}));
import { TransactionFilterRail } from "./TransactionFilterRail";

let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
it("groups children without changing exact filters or counts and reveals external selections", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const select = vi.fn();
  const render = (activeId = "all", collapsed = false) =>
    act(() =>
      root.render(
        <TransactionFilterRail
          title="Categories"
          description="Choose a category"
          allLabel="All categories"
          items={[
            {
              id: "rent",
              label: "Rent",
              accessibleLabel: "Housing / Rent",
              parentId: "housing",
              icon: null,
            },
            { id: "housing", label: "Housing", icon: null },
            { id: "food", label: "Food", icon: null },
          ]}
          activeId={activeId}
          totalCount={9}
          counts={
            new Map([
              ["housing", 6],
              ["rent", 2],
              ["food", 1],
            ])
          }
          onSelect={select}
          collapsed={collapsed}
          onToggleCollapsed={() => {}}
          collapseLabel="Collapse categories"
          expandLabel="Expand categories"
        />,
      ),
    );
  const button = (label: string) =>
    container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  render();
  const rent = button("Housing / Rent");
  expect(rent.textContent).toBe("Rent2");
  expect(rent.closest("ul")?.parentElement?.textContent).toContain("Housing6");
  act(() => rent.click());
  expect(select).toHaveBeenLastCalledWith("rent");
  const disclosure = container.querySelector<HTMLButtonElement>(
    'button[aria-expanded][aria-label="Housing"]',
  )!;
  act(() => disclosure.click());
  expect(select).toHaveBeenCalledTimes(1);
  expect(rent.closest("ul")?.hidden).toBe(true);
  render("rent");
  expect(button("Housing / Rent").closest("ul")?.hidden).toBe(false);
  expect(button("Housing / Rent").getAttribute("aria-pressed")).toBe("true");
  act(() =>
    container
      .querySelector<HTMLButtonElement>('button[aria-label="Select Housing"][aria-pressed]')!
      .click(),
  );
  expect(select).toHaveBeenLastCalledWith("housing");
  const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "rent");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(button("Housing / Rent").closest("ul")?.hidden).toBe(false);
  expect(button("Food")).toBeNull();
  expect(button("All categories")).not.toBeNull();
  expect(select).toHaveBeenCalledTimes(2);
  act(() => container.querySelector<HTMLButtonElement>('button[aria-label="clear"]')!.click());
  expect(button("Food")).not.toBeNull();
  render("rent", true);
  act(() => button("Housing / Rent: 2").click());
  expect(select).toHaveBeenLastCalledWith("rent");
});
