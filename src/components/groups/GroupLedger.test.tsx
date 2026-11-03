import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { GroupTransactions } from "./GroupLedger";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
const capture = vi.hoisted(() => ({
  selection: [] as { id: string; version: number }[],
  push: vi.fn(),
}));
vi.mock("@/hooks/useDesktop", () => ({ useDesktop: () => false }));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) => select({ editedHighlight: true, locale: "en-CA" }),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: capture.push }) }));
vi.mock("@/i18n/useFormatters", () => ({ useFormatters: () => ({ money: () => "$1" }) }));
vi.mock("./GroupCategorizeButton", () => ({ GroupCategorizeButton: () => null }));
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
  capture.push.mockClear();
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
function start(data: GroupSnapshot) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const onFiltersChange = vi.fn(),
    onEdit = vi.fn();
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
          onEdit={onEdit}
          onRefund={vi.fn()}
          refresh={vi.fn()}
          onBusyChange={vi.fn()}
        />,
      ),
    );
  render(data);
  return { render, onFiltersChange, onEdit };
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
it("selects complete matching results up to the cap, clears on filter changes, and exposes import", () => {
  const data = fixture(210);
  const { onFiltersChange } = start(data);
  click("import");
  expect(capture.push).toHaveBeenCalledWith(`/groups/${data.group.id}/import`);
  click("select");
  click("selectAll");
  expect(capture.selection).toHaveLength(200);
  expect(capture.selection.some((e) => e.id === "row-199")).toBe(true);
  const search = container.querySelector<HTMLButtonElement>('button[aria-label="filters"]')!;
  act(() => search.click());
  const scope = container.querySelector<HTMLSelectElement>('select[aria-label="searchScope"]')!;
  act(() => {
    scope.value = "month";
    scope.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(onFiltersChange).toHaveBeenCalledWith({
    scope: "all",
    dateFrom: "2026-10-01",
    dateTo: "2026-10-31",
  });
  expect(container.querySelector("[data-selection]")).toBeNull();
});

it("opens the same record from its compact edit action", () => {
  const data = fixture(2);
  const { onEdit } = start(data);
  const edit = container.querySelector<HTMLButtonElement>('button[aria-label="edit"]')!;
  expect(edit.textContent).toBe("");
  act(() => edit.click());
  expect(onEdit).toHaveBeenCalledWith(data.entries[0]);
});

it("opens mobile rows without intercepting details or batch selection", () => {
  const data = fixture(2);
  const { onEdit } = start(data);
  const row = container.querySelector("article")!;
  act(() => row.querySelector("h3")!.click());
  expect(onEdit).toHaveBeenCalledWith(data.entries[0]);
  onEdit.mockClear();
  act(() => row.querySelector("summary")!.click());
  expect(onEdit).not.toHaveBeenCalled();
  act(() => row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(onEdit).toHaveBeenCalledOnce();
  onEdit.mockClear();
  click("select");
  act(() => row.querySelector("h3")!.click());
  expect(onEdit).not.toHaveBeenCalled();
});
