import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { GroupTransactions } from "./GroupLedger";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
const capture = vi.hoisted(() => ({ selection: [] as { id: string; version: number }[] }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/useFormatters", () => ({ useFormatters: () => ({ money: () => "$1" }) }));
vi.mock("./GroupSpendingInsights", () => ({ GroupSpendingInsights: () => null }));
vi.mock("./GroupBulkActions", () => ({
  GroupBulkActions: ({ selection }: { selection: typeof capture.selection }) => {
    capture.selection = selection;
    return <div data-selection={selection.length} />;
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
function start(data: GroupSnapshot) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const onFiltersChange = vi.fn(),
    onImport = vi.fn();
  const render = (snapshot: GroupSnapshot) =>
    act(() =>
      root.render(
        <GroupTransactions
          data={snapshot}
          month="2026-10"
          page={snapshot.page}
          setPage={vi.fn()}
          filters={{}}
          onFiltersChange={onFiltersChange}
          loading={false}
          onEdit={vi.fn()}
          onRefund={vi.fn()}
          refresh={vi.fn()}
          onBusyChange={vi.fn()}
          onImport={onImport}
        />,
      ),
    );
  render(data);
  return { render, onFiltersChange, onImport };
}
function click(text: string) {
  const button = [...container.querySelectorAll("button")].find((b) => b.textContent === text)!;
  act(() => button.click());
}
it("adds pages to the selection and retains reviewed versions through refreshes", () => {
  const data = fixture(60),
    { render } = start(data);
  click("bulkSelect");
  click("bulkSelectPage");
  expect(capture.selection).toHaveLength(50);
  render({ ...data, page: 1, entries: data.reportEntries!.slice(50) });
  click("bulkSelectPage");
  expect(capture.selection).toHaveLength(60);
  render({ ...data, entries: data.entries.map((e) => ({ ...e, version: 1 })) });
  expect(capture.selection.every((e) => e.version === 0)).toBe(true);
});
it("selects complete matching results up to the cap, clears on filter changes, and exposes import", () => {
  const { onFiltersChange, onImport } = start(fixture(210));
  click("bulkImport");
  expect(onImport).toHaveBeenCalled();
  click("bulkSelect");
  click("bulkSelectMatches");
  expect(capture.selection).toHaveLength(200);
  expect(capture.selection.some((e) => e.id === "row-199")).toBe(true);
  const scope = container.querySelector<HTMLSelectElement>('select[aria-label="searchScope"]')!;
  act(() => {
    scope.value = "all";
    scope.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(onFiltersChange).toHaveBeenCalledWith({ scope: "all" });
  expect(container.querySelector("[data-selection]")).toBeNull();
});
