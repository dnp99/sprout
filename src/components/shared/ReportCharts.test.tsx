import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ComparisonAreaChart } from "@/components/ui/ComparisonAreaChart";
import { buildOverviewInsights } from "@/lib/overview-insights";
import { groupCumulativeComparison } from "@/lib/groups/report-presentation";
import { CashFlowChart } from "./CashFlowChart";
import { SpendingBarChart } from "./SpendingBarChart";
import { buildTrendsReport } from "@/lib/reports";
import type { Transaction } from "@/lib/types";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({
    monthKey: (key: string) => key,
    shortMonthKey: (key: string) => key,
    money: (cents: number) => String(cents),
  }),
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
function render(element: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(element));
}
const rows = [
  {
    id: "sample",
    isIncome: false,
    amountCents: -1200,
    occurredAt: "2026-10-02T12:00:00Z",
    categoryName: "Food",
    merchant: "Maple Market",
  },
] as Transaction[];
it("preserves Personal compact chart dimensions and hides Group-only selectors", () => {
  render(
    <>
      <CashFlowChart
        series={[
          { key: "2026-10", label: "Oct", incomeCents: 3000, expenseCents: 1200, netCents: 1800 },
        ]}
        selectedKey="2026-10"
        chartType="bar"
        projection={null}
        onPick={vi.fn()}
        dense
      />
      <SpendingBarChart
        chart={buildTrendsReport(rows, "month", "2026-10").chart}
        compact
        onSelectMonth={vi.fn()}
      />
    </>,
  );
  expect(container.querySelector(".soft-chart")?.classList.contains("h-[92px]")).toBe(true);
  expect(container.querySelectorAll('[style="height: 66px;"]')).toHaveLength(2);
  expect(container.querySelector("select")).toBeNull();
});
it("clears obsolete point feedback when drilling from month keys to daily keys", () => {
  const pick = vi.fn();
  render(
    <SpendingBarChart
      chart={buildTrendsReport(rows, "6m", "2026-10").chart}
      expanded
      onSelectMonth={pick}
    />,
  );
  act(() =>
    [...container.querySelectorAll<HTMLButtonElement>(".soft-chart button")].at(-1)!.click(),
  );
  expect(pick).toHaveBeenCalledWith("2026-10");
  expect(container.querySelector('[role="status"]')).not.toBeNull();
  act(() =>
    root.render(
      <SpendingBarChart
        chart={buildTrendsReport(rows, "month", "2026-10").chart}
        expanded
        onSelectMonth={pick}
      />,
    ),
  );
  expect(container.querySelector('[role="status"]')?.textContent).toBe("tapBar");
  expect(container.querySelector("select")).toBeNull();
});
it("shows a persistent selected-day detail and marks future-dated bars", () => {
  render(
    <SpendingBarChart
      chart={buildTrendsReport(rows, "month", "2026-10").chart}
      expanded
      futureKeys={["2026-10-02"]}
      onSelectMonth={vi.fn()}
    />,
  );
  expect(container.querySelector('[role="status"]')?.textContent).toBe("tapBar");
  const bar = container.querySelectorAll<HTMLButtonElement>(".soft-chart button")[1];
  act(() => bar.click());
  expect(bar.getAttribute("aria-pressed")).toBe("true");
  expect(bar.querySelector('[data-future="true"]')).not.toBeNull();
  expect(container.querySelector('[role="status"]')?.textContent).toContain("futureMark");
  act(() => bar.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })));
  expect(bar.getAttribute("aria-pressed")).toBe("true");
  expect(container.querySelector("select")).toBeNull();
});

it("keeps both comparison values in bounded feedback, including zero-spend dates", () => {
  const comparison = groupCumulativeComparison(
    buildOverviewInsights(
      rows,
      [],
      "2026-10",
      "month-vs-last-month",
      undefined,
      new Date("2026-10-11T12:00:00Z"),
    ).comparison,
  );
  render(
    <ComparisonAreaChart
      comparison={comparison}
      height={168}
      detail={{
        currentLabel: "Selected",
        compareLabel: "Previous",
        pointLabels: comparison.points.map((_, i) => `Date ${i + 1}`),
        instruction: "Choose a date",
        chartLabel: "Spending comparison",
      }}
    />,
  );
  const first = container.querySelector<HTMLButtonElement>(".soft-chart button")!;
  act(() => first.click());
  const status = container.querySelector('[role="status"]')!;
  expect(status.textContent).toContain("Date 1");
  expect(status.textContent).toContain("Selected0");
  expect(status.textContent).toContain("Previous0");
  expect(first.getAttribute("aria-pressed")).toBe("true");
  act(() => first.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })));
  expect(status.textContent).toContain("Date 1");
  expect(container.querySelector('path[stroke-dasharray="5 4"]')).not.toBeNull();
});
