import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { name?: string }) =>
    key === "selectParent" ? `${values?.name} only` : key,
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
  const render = (activeId = "all", collapsed = false, parentCount = 6) =>
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
            { id: "maintenance", label: "Maintenance", parentId: "housing", icon: null },
            { id: "housing", label: "Housing", icon: null },
            { id: "food", label: "Food", icon: null },
          ]}
          activeId={activeId}
          totalCount={10}
          counts={
            new Map([
              ["housing", parentCount],
              ["rent", 2],
              ["maintenance", 1],
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
  const initialBranch = button("Housing");
  expect(initialBranch.getAttribute("aria-expanded")).toBe("false");
  expect(rent.closest("ul")?.hidden).toBe(true);
  act(() => initialBranch.querySelector("span")!.click());
  expect(initialBranch.getAttribute("aria-expanded")).toBe("true");
  expect(select).not.toHaveBeenCalled();
  expect(rent.closest("ul")?.hidden).toBe(false);
  expect(rent.textContent).toBe("Rent2");
  expect(rent.closest("ul")?.parentElement?.textContent).toContain("Housing only6");
  act(() => rent.click());
  expect(select).toHaveBeenLastCalledWith("rent");
  const disclosure = container.querySelector<HTMLButtonElement>(
    'button[aria-expanded][aria-label="Housing"]',
  )!;
  expect(disclosure.textContent).toBe("Housing9");
  act(() => disclosure.click());
  expect(disclosure.textContent).toBe("Housing9");
  expect(select).toHaveBeenCalledTimes(1);
  expect(rent.closest("ul")?.hidden).toBe(true);
  render("rent");
  expect(button("Housing / Rent").closest("ul")?.hidden).toBe(false);
  expect(button("Housing / Rent").getAttribute("aria-pressed")).toBe("true");
  act(() =>
    container
      .querySelector<HTMLButtonElement>('button[aria-label="Housing only"][aria-pressed]')!
      .click(),
  );
  expect(select).toHaveBeenLastCalledWith("housing");
  // A parent with no direct assignments still summarizes both children.
  render("rent", false, 0);
  expect(button("Housing").textContent).toBe("Housing3");
  expect(button("Housing only").textContent).toBe("Housing only0");
  act(() => button("Housing").click());
  expect(rent.closest("ul")?.hidden).toBe(true);
  const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "rent");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(button("Housing / Rent").closest("ul")?.hidden).toBe(false);
  expect(button("Food")).toBeNull();
  expect(button("Maintenance")).toBeNull();
  expect(button("Housing").textContent).toBe("Housing3");
  expect(button("All categories").textContent).toBe("All categories10");
  expect(button("All categories")).not.toBeNull();
  expect(select).toHaveBeenCalledTimes(2);
  act(() => container.querySelector<HTMLButtonElement>('button[aria-label="clear"]')!.click());
  expect(button("Food")).not.toBeNull();
  expect(rent.closest("ul")?.hidden).toBe(true);
  render("rent", true);
  act(() => button("Housing / Rent: 2").click());
  expect(select).toHaveBeenLastCalledWith("rent");
});
