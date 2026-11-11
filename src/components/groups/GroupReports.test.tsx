import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { GroupCashFlowReport } from "./GroupCashFlowReport";
import { GroupSpendingReport } from "./GroupSpendingReport";
import { GroupReportRows } from "./GroupReportCards";
import type { Transaction } from "@/lib/types";
import { downloadTextFile } from "@/lib/download";

vi.mock("@/lib/download", () => ({ downloadTextFile: vi.fn() }));

const personal = vi.hoisted(() => ({ cashFlowMonthKey: "2025-01", categories: [], set: vi.fn() }));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: typeof personal) => unknown) => select(personal),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({
    locale: "en-CA",
    money: (v: number) => `${v} cents`,
    monthKey: (v: string) => v,
    shortMonthKey: (v: string) => v.slice(5),
  }),
}));
const rows = [
  {
    id: "a",
    merchant: "Maple Market",
    categoryName: "Food",
    categoryId: "food",
    amountCents: -1200,
    occurredAt: "2026-10-02T12:00:00Z",
    isIncome: false,
  },
  {
    id: "b",
    merchant: "Income",
    categoryName: "Income",
    amountCents: 4000,
    occurredAt: "2026-10-02T12:00:00Z",
    isIncome: true,
  },
] as Transaction[];
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
function render(element: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(element));
}

it("keeps cash-flow KPIs on the focused month, supports six-month picks and isolates Personal", () => {
  const pick = vi.fn();
  render(
    <GroupCashFlowReport
      transactions={rows}
      recurring={[]}
      scope={{ categories: [], month: "2026-09", onMonthChange: pick }}
    />,
  );
  const stats = container.querySelector("[data-group-report-kpis]")!;
  expect(stats.textContent).toContain("income0 cents");
  expect(stats.textContent).toContain("expenses0 cents");
  const buttons = [...container.querySelectorAll<HTMLButtonElement>(".soft-chart button")];
  expect(buttons).toHaveLength(6);
  act(() => buttons.at(-1)!.click());
  expect(pick).toHaveBeenCalledWith("2026-10");
  expect(personal.set).not.toHaveBeenCalled();
  expect(container.textContent).toContain("sparseScope");
});
it("preserves monthly chart drill-down and all four spending KPIs", () => {
  const drill = vi.fn();
  render(
    <GroupSpendingReport transactions={rows} period="6m" month="2026-10" onDrillMonth={drill} />,
  );
  expect(container.querySelector("[data-group-report-kpis]")?.children).toHaveLength(4);
  expect(container.querySelector("[data-group-report-kpis]")?.textContent).toContain("1200 cents");
  act(() => container.querySelector<HTMLButtonElement>(".soft-chart button")!.click());
  expect(drill).toHaveBeenCalledWith("2026-05");
  act(() =>
    [...container.querySelectorAll<HTMLButtonElement>(".soft-chart button")].at(-1)!.click(),
  );
  expect(drill).toHaveBeenLastCalledWith("2026-10");
});
it("keeps all long-list rows accessible through progressive disclosure", () => {
  render(
    <GroupReportRows
      empty="Empty"
      rows={Array.from({ length: 8 }, (_, i) => ({
        id: `${i}`,
        label: `Category ${i}`,
        value: `${i} cents`,
      }))}
    />,
  );
  expect(container.querySelectorAll("li")).toHaveLength(5);
  act(() => container.querySelector<HTMLButtonElement>("button")!.click());
  expect(container.querySelectorAll("li")).toHaveLength(8);
});
it("renders an empty report with controls and finite zero totals", () => {
  render(
    <GroupCashFlowReport
      transactions={[]}
      recurring={[]}
      scope={{ categories: [], month: "2026-10", onMonthChange: vi.fn() }}
    />,
  );
  expect(container.querySelector("[data-group-report-kpis]")?.textContent).toContain("0 cents");
  expect(container.textContent).not.toMatch(/NaN|Infinity/);
  expect(container.querySelectorAll(".soft-chart button")).toHaveLength(6);
});
it("retains Bar/Line switching and exports the six-month series as CSV", () => {
  render(
    <GroupCashFlowReport
      transactions={rows}
      recurring={[]}
      scope={{ categories: [], month: "2026-10", onMonthChange: vi.fn() }}
    />,
  );
  const line = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent === "line",
  )!;
  act(() => line.click());
  expect(line.getAttribute("aria-pressed")).toBe("true");
  expect(container.querySelectorAll(".soft-chart ellipse")).toHaveLength(12);
  const exportButton = [...container.querySelectorAll<HTMLButtonElement>("button")].find((button) =>
    button.textContent?.includes("exportCsv"),
  )!;
  act(() => exportButton.click());
  expect(downloadTextFile).toHaveBeenCalledWith(
    "sprout-cash-flow-2026-05-to-2026-10.csv",
    expect.stringContaining("October 2026,40.00,12.00,28.00"),
  );
  expect(vi.mocked(downloadTextFile).mock.calls[0][1].split("\n")).toHaveLength(7);
});
