import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OverviewDashboard } from "./OverviewDashboard";
import { EverydayCalendar } from "@/components/shared/EverydayCalendar";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({
    locale: "en-CA",
    monthKey: (key: string) => key,
    money: (value: number) => String(value),
  }),
}));
vi.mock("@/components/shared/RecordedTime", () => ({ RecordedTime: () => null }));
let width = 1200,
  root: ReturnType<typeof createRoot>,
  host: HTMLDivElement;
const observers = new Set<() => void>();
const viewAll = vi.fn(),
  budget = vi.fn(),
  explore = vi.fn(),
  edit = vi.fn();
function Harness() {
  const [month, setMonth] = useState("2026-11");
  return (
    <OverviewDashboard
      period={month}
      loading={false}
      metrics={[{ label: "Spending", cents: 100 }]}
      calendar={(renderCards) => (
        <EverydayCalendar
          dashboard
          renderCards={renderCards}
          month={month}
          onMonthChange={setMonth}
          onViewAll={viewAll}
          onEdit={edit}
          records={[10, 11, 13].map((day) => ({
            id: String(day),
            date: `2026-11-${day}`,
            name: `Maple ${day}`,
            category: "Food",
            emoji: "",
            amountCents: -100,
            spendingCents: 100,
            incomeCents: 0,
          }))}
        />
      )}
      budget={<button onClick={budget}>Budget action</button>}
      merchants={<p>Frequent merchants</p>}
      insights={<button onClick={explore}>Explore Trends</button>}
    />
  );
}
const slots = () =>
  [...host.querySelectorAll<HTMLElement>("[data-dashboard-slot]")].map(
    (node) => node.dataset.dashboardSlot,
  );
const click = (label: string) =>
  act(() =>
    [...host.querySelectorAll<HTMLButtonElement>("button")]
      .find((b) => b.textContent === label)!
      .click(),
  );
const resize = (next: number) =>
  act(() => {
    width = next;
    [...observers].forEach((update) => update());
  });
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 13));
  width = 1200;
  observers.clear();
  viewAll.mockClear();
  budget.mockClear();
  explore.mockClear();
  edit.mockClear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private update: () => void) {}
      observe() {
        observers.add(this.update);
      }
      disconnect() {
        observers.delete(this.update);
      }
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    return {
      width: this.classList.contains("dashboard-layout") ? width : 0,
      height: 0,
      x: 0,
      y: 0,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      toJSON: () => ({}),
    };
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("uses independent stacks when wide and the correct single-copy mobile DOM order when narrow", () => {
  const columns = host.querySelectorAll(".dashboard-column");
  expect(columns).toHaveLength(2);
  expect([...columns[0].children].map((n) => n.getAttribute("data-dashboard-slot"))).toEqual([
    "calendar",
    "budget",
    "merchants",
  ]);
  expect([...columns[1].children].map((n) => n.getAttribute("data-dashboard-slot"))).toEqual([
    "recent",
    "insights",
  ]);
  expect(slots()).toHaveLength(5);
  expect(host.querySelector(".dashboard-metrics")?.nextElementSibling).toBe(
    host.querySelector(".dashboard-layout"),
  );
  resize(720);
  expect(slots()).toEqual(["calendar", "recent", "budget", "merchants", "insights"]);
  expect(host.querySelectorAll(".everyday-calendar")).toHaveLength(1);
  expect(host.querySelectorAll(".dashboard-recent")).toHaveLength(1);
  expect(host.querySelectorAll(".calendar-day")).toHaveLength(7);
});
it("preserves calendar mode, selected day and agenda scope across composition changes", () => {
  click("month");
  act(() =>
    host.querySelector<HTMLButtonElement>('.calendar-day[aria-label*="November 11"]')!.click(),
  );
  expect(host.querySelector(".dashboard-recent h3")?.textContent).toContain("Nov 11");
  resize(600);
  expect(host.querySelector('button[aria-pressed="true"]')?.textContent).toBe("month");
  expect(
    host.querySelector('.calendar-day[aria-pressed="true"] .calendar-day-number')?.textContent,
  ).toBe("11");
  expect(host.querySelectorAll(".dashboard-recent .record-row")).toHaveLength(1);
  click("recentTransactions");
  resize(1200);
  expect(host.querySelectorAll(".dashboard-recent .record-row")).toHaveLength(3);
  expect(
    host.querySelector('.calendar-day[aria-pressed="true"] .calendar-day-number')?.textContent,
  ).toBe("11");
  click("Budget action");
  click("Explore Trends");
  click("viewAll");
  expect(budget).toHaveBeenCalledOnce();
  expect(explore).toHaveBeenCalledOnce();
  expect(viewAll).toHaveBeenCalledOnce();
});
