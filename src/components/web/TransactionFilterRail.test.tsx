import { act, useState, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { name?: string }) =>
    key === "selectParent" ? `${values?.name} only` : key,
}));
vi.mock("@/hooks/useDesktop", () => ({ useDesktop: () => true }));
import { TransactionFilterRail } from "./TransactionFilterRail";
let root: ReturnType<typeof createRoot>, host: HTMLDivElement;
const select = vi.fn();
const items = [
  { id: "housing", label: "Housing", icon: null },
  { id: "condo", label: "Condo & Maintenance", parentId: "housing", icon: null },
  { id: "decor", label: "Furniture & Decor", parentId: "housing", icon: null },
  { id: "empty", label: "Home Insurance", parentId: "housing", icon: null },
  { id: "food", label: "Food", icon: null },
];
const props = {
  title: "Categories",
  description: "",
  allLabel: "All categories",
  items,
  activeId: "all",
  totalCount: 2,
  counts: new Map([
    ["condo", 1],
    ["decor", 1],
  ]),
  onSelect: select,
  collapsed: false,
  onToggleCollapsed: vi.fn(),
  collapseLabel: "Collapse",
  expandLabel: "Expand",
};
type Props = ComponentProps<typeof TransactionFilterRail>;
const render = (overrides: Partial<Props> = {}) =>
  act(() => root.render(<TransactionFilterRail {...props} {...overrides} />));
const button = (label: string) =>
  document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
const click = (label: string) => act(() => button(label).click());
const expanded = () => button("Housing").getAttribute("aria-expanded");
function search(value: string) {
  act(() => {
    const input = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  sessionStorage.clear();
  select.mockClear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("starts collapsed even for asynchronously loaded categories; parent clicks never select", () => {
  render({ items: [] });
  render();
  expect(expanded()).toBe("false");
  click("Housing");
  expect(expanded()).toBe("true");
  expect(select).not.toHaveBeenCalled();
  expect(button("Housing").getAttribute("aria-controls")).toBeTruthy();
  expect(button("Housing").textContent).toBe("Housing2");
  expect(button("Housing only").textContent).toBe("Housing only0");
  click("Housing only");
  expect(select).toHaveBeenLastCalledWith("housing");
  click("Housing / Furniture & Decor");
  expect(select).toHaveBeenLastCalledWith("decor");
  expect(button("Housing / Furniture & Decor").hasAttribute("aria-expanded")).toBe(false);
  expect(host.querySelector("button button")).toBeNull();
});
it("reveals external selections, respects explicit collapse and clears overrides for a new child", () => {
  render({ activeId: "decor" });
  expect(expanded()).toBe("true");
  expect(button("Housing / Furniture & Decor").getAttribute("aria-pressed")).toBe("true");
  click("Housing");
  expect(expanded()).toBe("false");
  expect(button("Housing").querySelector('[class*="circle-dot"]')).not.toBeNull();
  expect(button("Housing").querySelector('[class*="lucide-check"]')).toBeNull();
  render({ activeId: "decor", counts: new Map() });
  expect(expanded()).toBe("false");
  render({ activeId: "condo" });
  expect(expanded()).toBe("true");
});
it("search reveals the matching hierarchy temporarily and restores manual collapse", () => {
  render({ activeId: "decor" });
  click("Housing");
  search("furniture");
  expect(expanded()).toBe("true");
  expect(button("Food")).toBeNull();
  expect(button("Housing / Condo & Maintenance")).toBeNull();
  expect(button("Housing").textContent).toBe("Housing2");
  expect(select).not.toHaveBeenCalled();
  click("clear");
  expect(expanded()).toBe("false");
  search("housing");
  expect(button("Housing / Condo & Maintenance")).not.toBeNull();
  search("unknown");
  expect(document.querySelector('[role="status"]')?.textContent).toBe("empty");
  expect(button("All categories")).not.toBeNull();
  click("All categories");
  expect(select).toHaveBeenLastCalledWith("all");
});
it("keeps manual expansion on collapse/reopen and unrelated month-count updates", () => {
  render();
  click("Housing");
  render({ collapsed: true });
  render({ counts: new Map() });
  expect(expanded()).toBe("true");
});
it("hides zero rows but preserves selected zero and ancestors; preference survives remount", () => {
  render({ activeId: "empty" });
  click("preferences");
  act(() => document.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
  expect(button("Food")).toBeNull();
  expect(button("Housing / Home Insurance")).not.toBeNull();
  render({ activeId: "all" });
  expect(button("Housing / Home Insurance")).toBeNull();
  expect(button("Housing only")).toBeNull();
  search("insurance");
  expect(button("Housing / Home Insurance")).not.toBeNull();
  act(() => root.render(<div />));
  render();
  expect(button("Food")).toBeNull();
});
function Mobile() {
  const [activeId, setActive] = useState("all");
  return (
    <div data-ledger-context="group">
      <TransactionFilterRail
        {...props}
        activeId={activeId}
        mobile
        onSelect={(id) => {
          setActive(id);
          select(id);
        }}
      />
    </div>
  );
}
it.each(["Housing / Furniture & Decor", "Housing only", "All categories"])(
  "mobile %s selects, closes and restores focus",
  (label) => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
      { width: 44 },
    ] as unknown as DOMRectList);
    act(() => root.render(<Mobile />));
    const anchor = host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!;
    anchor.focus();
    act(() => anchor.click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    click("Housing");
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    click(label);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(select).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(anchor);
    act(() => anchor.click());
    expect(expanded()).toBe("true");
    act(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  },
);
it("reflects existing advanced multi-category selections without treating All as selected", () => {
  render({ selectedIds: ["decor", "empty"] });
  expect(expanded()).toBe("true");
  expect(button("All categories").getAttribute("aria-pressed")).toBe("false");
  expect(button("Housing / Furniture & Decor").getAttribute("aria-pressed")).toBe("true");
  expect(button("Housing / Home Insurance").getAttribute("aria-pressed")).toBe("true");
});
it("late-loaded selected children reveal their path, while other branches stay closed", () => {
  render({ items: [], activeId: "decor" });
  render({ activeId: "decor" });
  expect(expanded()).toBe("true");
});
it("isolates manual expansion between mounted Personal and Group rails", () => {
  act(() =>
    root.render(
      <>
        <section data-mode="personal">
          <TransactionFilterRail {...props} />
        </section>
        <section data-mode="group">
          <TransactionFilterRail {...props} />
        </section>
      </>,
    ),
  );
  const branches = host.querySelectorAll<HTMLButtonElement>("[data-category-branch]");
  act(() => branches[0].click());
  expect(branches[0].getAttribute("aria-expanded")).toBe("true");
  expect(branches[1].getAttribute("aria-expanded")).toBe("false");
});
it("Escape dismisses preferences before the sheet and keeps keyboard focus inside", () => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
    { width: 44 },
  ] as unknown as DOMRectList);
  act(() => root.render(<Mobile />));
  act(() => host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!.click());
  click("preferences");
  const input = document.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  input.focus();
  act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(document.querySelector(".category-filter-preferences")).toBeNull();
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  expect(document.activeElement).toBe(button("preferences"));
});
it("shows compact category icons, selected child state and branch reopening", () => {
  const expand = vi.fn();
  render({ collapsed: true, activeId: "decor", onToggleCollapsed: expand });
  expect(host.querySelectorAll(".category-filter-compact-option")).toHaveLength(3);
  expect(button("Housing / Furniture & Decor").getAttribute("aria-pressed")).toBe("true");
  expect(button("Housing").getAttribute("data-selected")).toBe("true");
  click("Housing");
  expect(expand).toHaveBeenCalledOnce();
  expect(select).not.toHaveBeenCalled();
  click("Housing / Furniture & Decor");
  expect(select).toHaveBeenCalledWith("decor");
});
function Multi({ mobile = false, collapsed = false }: { mobile?: boolean; collapsed?: boolean }) {
  const [selectedIds, setSelected] = useState<string[]>([]);
  return (
    <TransactionFilterRail
      {...props}
      mobile={mobile}
      collapsed={collapsed}
      selectedIds={selectedIds}
      onSelectionChange={(ids) => {
        setSelected(ids);
        select(ids);
      }}
    />
  );
}
it("adds and removes categories with OR selection, including parent-only actions", () => {
  act(() => root.render(<Multi />));
  click("Housing");
  click("Housing only");
  click("Housing / Furniture & Decor");
  click("Food");
  expect(select).toHaveBeenLastCalledWith(["housing", "decor", "food"]);
  expect(button("Housing only").getAttribute("aria-pressed")).toBe("true");
  expect(button("Food").getAttribute("aria-pressed")).toBe("true");
  click("Housing / Furniture & Decor");
  expect(select).toHaveBeenLastCalledWith(["housing", "food"]);
  click("All categories");
  expect(select).toHaveBeenLastCalledWith([]);
});
it("mobile multiselect applies immediately without closing between category choices", () => {
  act(() => root.render(<Multi mobile />));
  act(() => host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!.click());
  click("Housing");
  click("Housing / Furniture & Decor");
  click("Food");
  expect(select).toHaveBeenLastCalledWith(["decor", "food"]);
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  click("All categories");
  expect(select).toHaveBeenLastCalledWith([]);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
it("adding another category does not reopen a manually collapsed selected branch", () => {
  act(() => root.render(<Multi />));
  click("Housing");
  click("Housing / Furniture & Decor");
  click("Housing");
  expect(expanded()).toBe("false");
  click("Food");
  expect(expanded()).toBe("false");
  expect(select).toHaveBeenLastCalledWith(["decor", "food"]);
});
