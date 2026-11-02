import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useCashFlow, type CashFlowScope } from "./useCashFlow";
import type { Transaction } from "@/lib/types";

const personal = vi.hoisted(() => ({ cashFlowMonthKey: "2026-09", categories: [], set: vi.fn() }));
vi.mock("@/state/store", () => ({
  useStore: (select: (state: typeof personal) => unknown) => select(personal),
}));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const transactions: Transaction[] = [
  {
    id: "expense",
    merchant: "Market",
    emoji: "",
    categoryId: null,
    categoryName: "",
    amountCents: -1200,
    method: "",
    status: "posted",
    dateLabel: "2026-10-02",
    occurredAt: "2026-10-02T12:00:00Z",
    isIncome: false,
  },
];

function render(scope?: CashFlowScope) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  let result!: ReturnType<typeof useCashFlow>;
  function Probe() {
    result = useCashFlow(transactions, [], scope);
    return null;
  }
  act(() => root.render(<Probe />));
  return result;
}

it("uses group month and routes chart/step changes only to the group owner", () => {
  const onMonthChange = vi.fn();
  const result = render({ month: "2026-10", categories: [], onMonthChange });
  expect(result.selectedKey).toBe("2026-10");
  expect(result.summary.expenseCents).toBe(1200);
  result.setPicked("2026-08");
  result.stepMonth(-1);
  expect(onMonthChange.mock.calls).toEqual([["2026-08"], ["2026-09"]]);
  expect(personal.set).not.toHaveBeenCalled();
});

it("retains the personal store selection and actions without an explicit scope", () => {
  const result = render();
  expect(result.selectedKey).toBe("2026-09");
  result.setPicked("2026-10");
  expect(personal.set).toHaveBeenCalledWith({ cashFlowMonthKey: "2026-10" });
});

it("shows the requested empty group month instead of silently falling back to latest activity", () => {
  const result = render({ month: "2026-11", categories: [], onMonthChange: vi.fn() });
  expect(result.selectedKey).toBe("2026-11");
  expect(result.summary.expenseCents).toBe(0);
  expect(result.keys).toContain("2026-11");
});

it("aggregates the explicit group period and uses the same range for breakdowns", () => {
  const report = render({ period: "6m", month: "2026-11", categories: [], onMonthChange: vi.fn() });
  expect(report.keys).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
  expect(report.summary.expenseCents).toBe(1200);
  expect(report.expenseMerchants).toEqual([
    expect.objectContaining({ name: "Market", cents: 1200 }),
  ]);
  expect(personal.set).not.toHaveBeenCalled();
});

it("uses a single-month range for an explicit Month selection", () => {
  const report = render({
    period: "month",
    month: "2026-11",
    categories: [],
    onMonthChange: vi.fn(),
  });
  expect(report.keys).toEqual(["2026-11"]);
  expect(report.summary.expenseCents).toBe(0);
});
