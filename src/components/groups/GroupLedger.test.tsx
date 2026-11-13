import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { GroupTransactions } from "./GroupLedger";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
const capture = vi.hoisted(() => ({
  selection: [] as { id: string; version: number }[],
  push: vi.fn(),
  desktop: false,
  hidden: 0,
}));
vi.mock("@/hooks/useTransactionFieldVisibility", () => ({
  useTransactionFieldVisibility: () => {},
}));
vi.mock("@/hooks/useDesktop", () => ({ useDesktop: () => capture.desktop }));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) => select({ editedHighlight: true, locale: "en-CA" }),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { count?: number }) =>
    key === "monthCount" ? `monthCount: ${values?.count}` : key,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: capture.push }) }));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({
    money: () => "$1",
    monthKey: (value: string) => value,
    txnDate: (value: string) => value.slice(0, 10),
    txnSearchDate: (value: string) => value.slice(0, 10),
    locale: "en-CA",
  }),
}));
vi.mock("./GroupCategorizeButton", () => ({ GroupCategorizeButton: () => null }));
vi.mock("./GroupSpendingInsights", () => ({ GroupSpendingInsights: () => null }));
vi.mock("./GroupBulkActions", () => ({
  GroupBulkActions: ({
    selection,
    hiddenCount = 0,
    onSelectMatches,
  }: {
    selection: typeof capture.selection;
    hiddenCount?: number;
    onSelectMatches?: () => void;
  }) => {
    capture.selection = selection;
    capture.hidden = hiddenCount;
    return (
      <div data-selection={selection.length}>
        {onSelectMatches && <button onClick={onSelectMatches}>bulkSelectMatches</button>}
      </div>
    );
  },
}));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  capture.selection = [];
  capture.push.mockClear();
  capture.desktop = false;
  capture.hidden = 0;
  vi.unstubAllGlobals();
});
const rows = (count: number) =>
  Array.from(
    { length: count },
    (_, i) =>
      ({
        id: `row-${i}`,
        version: 0,
        kind: "expense",
        refundOf: null,
        settlement: true,
        splitMethod: "equal",
        merchant: `Market ${i}`,
        note: "",
        occurredOn: "2026-10-01",
        amountCents: -100,
        payerId: null,
        authorId: "member",
        categoryId: null,
        voidedAt: null,
        shares: [],
      }) as GroupEntry,
  );
function fixture(count: number) {
  const entries = rows(count);
  return {
    group: { id: "group", memberId: "member", role: "owner", revision: 0 },
    members: [],
    categories: [],
    entries: entries.slice(0, 50),
    reportEntries: entries,
    totalEntries: count,
    page: 0,
  } as unknown as GroupSnapshot;
}
function start(
  data: GroupSnapshot,
  filters: import("@/lib/groups/search").GroupLedgerFilters = {},
  loading = false,
) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const onFiltersChange = vi.fn(),
    onEdit = vi.fn(),
    onAdd = vi.fn(),
    onRefund = vi.fn();
  const render = (snapshot: GroupSnapshot, nextFilters = filters, nextMonth = "2026-10") =>
    act(() =>
      root.render(
        <GroupTransactions
          data={snapshot}
          month={nextMonth}
          page={snapshot.page}
          setPage={vi.fn()}
          filters={nextFilters}
          onFiltersChange={onFiltersChange}
          loading={loading}
          onEdit={onEdit}
          onRefund={onRefund}
          onAdd={onAdd}
          refresh={vi.fn()}
          onBusyChange={vi.fn()}
        />,
      ),
    );
  render(data);
  return { render, onFiltersChange, onEdit, onAdd, onRefund };
}
function click(text: string) {
  const button = [...container.querySelectorAll("button")].find((b) => b.textContent === text)!;
  act(() => button.click());
}
it("adds pages to the selection and retains reviewed versions through refreshes", () => {
  const data = fixture(60),
    { render } = start(data);
  click("select");
  act(() => {
    container
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((input) => input.click());
  });
  expect(capture.selection).toHaveLength(50);
  render({ ...data, page: 1, entries: data.reportEntries!.slice(50) });
  click("selectAll");
  expect(capture.selection).toHaveLength(60);
  render({ ...data, entries: data.entries.map((e) => ({ ...e, version: 1 })) });
  expect(capture.selection.every((e) => e.version === 0)).toBe(true);
});
it("selects complete matching results up to the cap and retains them on filter changes", () => {
  const data = fixture(210);
  const { onFiltersChange } = start(data);
  click("select");
  click("selectAll");
  expect(capture.selection).toHaveLength(200);
  expect(capture.selection.some((e) => e.id === "row-199")).toBe(true);
  const search = container.querySelector<HTMLButtonElement>('button[aria-label="filters"]')!;
  act(() => search.click());
  const scope = document.querySelector<HTMLSelectElement>('select[aria-label="searchScope"]')!;
  act(() => {
    scope.value = "month";
    scope.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(onFiltersChange).not.toHaveBeenCalled();
  act(() => document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
  expect(onFiltersChange).toHaveBeenCalledWith(
    expect.objectContaining({
      scope: "all",
      dateFrom: "2026-10-01",
      dateTo: "2026-10-31",
    }),
  );
  expect(capture.selection).toHaveLength(200);
});

it("opens mobile record details with explicit edit access", () => {
  const data = fixture(2);
  const { onEdit } = start(data);
  const target = container.querySelector<HTMLButtonElement>(
    'button[aria-label="recordDetails: Market 0"]',
  )!;
  act(() => target.click());
  const dialog = container.querySelector('[role="dialog"]')!;
  expect(dialog).not.toBeNull();
  expect(onEdit).not.toHaveBeenCalled();
  const edit = [...dialog.querySelectorAll("button")].find(
    (button) => button.textContent === "edit",
  )!;
  act(() => edit.click());
  expect(onEdit).toHaveBeenCalledWith(data.entries[0]);
});

it("toggles mobile rows in selection mode instead of opening a record", () => {
  start(fixture(2));
  click("select");
  const row = container.querySelector("article")!;
  act(() => row.querySelector<HTMLButtonElement>('button[aria-label="bulkSelectRecord"]')!.click());
  expect(capture.selection).toHaveLength(1);
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});

it("matches Personal's desktop table hierarchy and selects matches from the header", () => {
  capture.desktop = true;
  const { onAdd, onFiltersChange } = start(fixture(210));
  expect(container.querySelector(".cozy-transaction-rail")).not.toBeNull();
  expect(container.querySelector(".cozy-transaction-head")).not.toBeNull();
  expect(container.querySelector(".cozy-transaction-total")).not.toBeNull();
  expect(container.querySelector(".mobile-selection-bar")).toBeNull();
  expect(container.textContent).not.toContain("bulkSelectPage");
  click("addTransaction");
  expect(onAdd).toHaveBeenCalledOnce();
  const header = container.querySelector('.cozy-transaction-head input[type="checkbox"]')!;
  act(() => (header as HTMLInputElement).click());
  expect(capture.selection).toHaveLength(50);
  click("bulkSelectMatches");
  expect(capture.selection).toHaveLength(200);
  expect(container.querySelector('button[data-filter-kind="refund"]')).toBeNull();
  act(() => container.querySelector<HTMLButtonElement>('button[aria-label="filters"]')!.click());
  act(() => document.querySelector<HTMLInputElement>('[role="switch"]')!.click());
  expect(onFiltersChange).not.toHaveBeenCalled();
  act(() => document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
  expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ quick: "refund" }));
  expect(capture.selection).toHaveLength(200);
});

it("provides Edit and Refund in the row menu", () => {
  capture.desktop = true;
  const data = fixture(1);
  const { onRefund } = start(data);
  const menu = container.querySelector<HTMLButtonElement>('button[aria-label="rowActions"]')!;
  act(() => menu.click());
  click("refund");
  expect(onRefund).toHaveBeenCalledWith(data.entries[0]);
});

it("counts the selected month separately from all-date matching records", () => {
  capture.desktop = true;
  const data = fixture(60);
  data.reportEntries![0].occurredOn = "2026-09-01";
  start(data, { scope: "all" });
  expect(container.querySelector(".cozy-transaction-total")?.textContent).toContain(
    "monthCount: 59",
  );
  expect(container.querySelector(".cozy-transaction-total nav")?.textContent).toContain(
    "1–50 / 60",
  );
});

it("keeps refresh feedback inside the record viewport without adding a footer row", () => {
  capture.desktop = true;
  start(fixture(60), {}, true);
  const region = container.querySelector(".group-record-viewport")!;
  expect(region.querySelector('[data-record-loading] [role="status"]')).not.toBeNull();
  expect(region.querySelector("article")).not.toBeNull();
  expect(region.querySelector('[aria-busy="true"]')).not.toBeNull();
  expect(container.querySelector(".cozy-transaction-total")?.previousElementSibling).toBe(region);
  expect(container.querySelector("section")?.lastElementChild?.className).toContain(
    "cozy-transaction-table",
  );
});

it("veils only the record viewport and prevents interacting with stale rows", () => {
  capture.desktop = true;
  start(fixture(60), {}, true);
  const veil = container.querySelector("[data-record-loading]")!;
  expect(veil.className).toContain("inset-0");
  expect(veil.className).toContain("record-loading-veil");
  expect(container.querySelector(".record-list")?.hasAttribute("inert")).toBe(true);
  expect(veil.contains(container.querySelector(".cozy-transaction-total"))).toBe(false);
  expect(veil.contains(container.querySelector(".cozy-transaction-head"))).toBe(false);
});

it("keeps multi-page mobile paging outside the scrolling record list", () => {
  start(fixture(60));
  const pager = container.querySelector(".mobile-transaction-pagination")!;
  expect(pager).not.toBeNull();
  expect(container.querySelector(".record-list")?.contains(pager)).toBe(false);
  expect(pager.querySelector('[aria-label="next"]')?.textContent).toBe("next");
});
it("does not reserve a mobile pager for a single page", () => {
  start(fixture(50));
  expect(container.querySelector(".mobile-transaction-pagination")).toBeNull();
});

it.each([false, true])("places type filters before search with desktop=%s", (desktop) => {
  capture.desktop = desktop;
  start(fixture(60));
  // The desktop category rail has its own search; compare against GroupSearch.
  const search = container.querySelector('input[type="search"][aria-label="searchPlaceholder"]')!;
  const filters = desktop
    ? container.querySelector('[data-filter-kind="all"]')!
    : container.querySelector('[aria-label="transactionScope"]')!;
  expect(filters.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it.each([false, true])(
  "preserves selection through searches and adds new matches (desktop=%s)",
  (desktop) => {
    capture.desktop = desktop;
    const data = fixture(3);
    const { render } = start(data);
    if (!desktop) click("select");
    act(() =>
      container
        .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
        [desktop ? 1 : 0]!.click(),
    );
    const reviewed = [...capture.selection];
    expect(reviewed).toHaveLength(1);
    render(data, { query: "Market 1", scope: "all" });
    expect(capture.selection).toEqual(reviewed);
    expect(capture.hidden).toBe(1);
    if (!desktop) click("selectAll");
    else act(() => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    expect(capture.selection).toHaveLength(2);
    render(data, { query: "no matches", scope: "all" });
    expect(capture.selection).toHaveLength(2);
    render(data, {});
    expect(capture.selection).toHaveLength(2);
  },
);
it("keeps rail disclosure across months while resetting reviewed bulk entries", () => {
  capture.desktop = true;
  const data = fixture(2);
  data.categories = [
    { id: "housing", name: "Housing", emoji: "", parentId: null, archived: false },
    { id: "decor", name: "Furniture & Decor", emoji: "", parentId: "housing", archived: false },
  ] as GroupSnapshot["categories"];
  const { render, onFiltersChange } = start(data, { category: "decor", query: "Market" });
  const branch = () =>
    container.querySelector<HTMLButtonElement>('[data-category-branch][aria-label="Housing"]')!;
  expect(branch().getAttribute("aria-expanded")).toBe("true");
  act(() => branch().click());
  render(data, { query: "Market" });
  const checkbox = container.querySelector<HTMLInputElement>(
    '.cozy-transaction-head input[type="checkbox"]',
  )!;
  act(() => checkbox.click());
  expect(capture.selection).toHaveLength(2);
  render(data, { query: "Market", category: "decor" }, "2026-11");
  // A different selection clears conflicting collapse; explicitly collapse again.
  act(() => branch().click());
  expect(branch().getAttribute("aria-expanded")).toBe("false");
  render(data, { query: "Market", category: "decor" }, "2026-12");
  expect(branch().getAttribute("aria-expanded")).toBe("false");
  expect(
    container.querySelector(".cozy-transaction-head input")?.getAttribute("checked"),
  ).toBeNull();
  act(() =>
    container.querySelector<HTMLButtonElement>('button[aria-label="allCategories"]')!.click(),
  );
  expect(onFiltersChange).toHaveBeenLastCalledWith({ query: "Market", category: undefined });
});
