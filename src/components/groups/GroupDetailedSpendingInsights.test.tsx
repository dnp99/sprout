import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { GroupDetailedSpendingInsights } from "./GroupDetailedSpendingInsights";
import type { Category } from "@/lib/types";
import type { SpendingRecord } from "@/lib/overview-insights";

const state = vi.hoisted(() => ({ locale: "en-CA" }));
vi.mock("@/state/store", () => ({
  useStore: (select: (value: typeof state) => unknown) => select(state),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
function render() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const onMonthChange = vi.fn();
  const categories = Array.from({ length: 8 }, (_, i) => ({
    id: `cat${i}`,
    name: `Category ${i}`,
    color: "var(--primary)",
  })) as Category[];
  const transactions = categories.flatMap((cat, i) => [
    ...(i < 7
      ? [
          {
            id: `now${i}`,
            categoryId: cat.id,
            occurredAt: "2026-10-01T12:00:00Z",
            amountCents: -1000,
            isIncome: false,
            payerId: "alex",
          },
        ]
      : []),
    {
      id: `prior${i}`,
      categoryId: cat.id,
      occurredAt: "2026-09-01T12:00:00Z",
      amountCents: -500,
      isIncome: false,
      payerId: "alex",
    },
  ]) as SpendingRecord[];
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <GroupDetailedSpendingInsights
        source={{
          transactions,
          categories,
          payers: [{ id: "alex", name: "Alex" }],
          month: "2026-10",
          onMonthChange,
          loading: false,
        }}
      />,
    ),
  );
  return onMonthChange;
}
function click(label: string) {
  const scope = container.querySelector(".report-selection-dialog") ?? container;
  const button = [...scope.querySelectorAll<HTMLButtonElement>("button")].find((el) =>
    el.textContent?.trim().startsWith(label),
  )!;
  if (!button) throw Error(`Missing ${label}`);
  act(() => button.click());
}
it("keeps all current and comparison-only categories accessible after disclosure", () => {
  render();
  expect(container.querySelector('[aria-label="detailedTitle"]')).not.toBeNull();
  const explore = [...container.querySelectorAll("button")].find((el) =>
    el.textContent?.trim().startsWith("showAnalysis"),
  )!;
  expect(explore.getAttribute("aria-expanded")).toBe("false");
  click("showAnalysis");
  expect(container.querySelectorAll("li")).toHaveLength(5);
  click("viewAll");
  expect(container.querySelectorAll("li")).toHaveLength(8);
  expect(container.textContent).toContain("Category 7");
  expect(container.textContent).toContain("onlyComparisonPeriod");
});
it("stages payer/category drafts, applies them together, and cancels without changes", () => {
  render();
  click("showAnalysis");
  click("reportFilters");
  const sheet = container.querySelector(".report-selection-dialog")!;
  const payer = sheet.querySelectorAll("select")[2];
  act(() => {
    payer.value = "alex";
    payer.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const category = sheet.querySelectorAll("select")[3];
  act(() => {
    category.value = "cat1";
    category.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("allPayers");
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("allCategories");
  click("apply");
  expect(container.querySelector(".report-selection-dialog")).toBeNull();
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("Alex");
  click("reportFilters");
  click("resetReportFilters");
  act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("Alex");
  click("reportFilters");
  click("resetReportFilters");
  click("apply");
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("allPayers");
  expect(
    [...container.querySelectorAll("button")].some((b) => b.textContent === "resetReportFilters"),
  ).toBe(false);
});

it("keeps Reset hidden at defaults and comparison month navigation independent of main", () => {
  const mainChange = render();
  click("showAnalysis");
  expect(
    [...container.querySelectorAll("button")].some((b) => b.textContent === "resetReportFilters"),
  ).toBe(false);
  const previous = container.querySelector<HTMLButtonElement>(".month-selector button")!;
  act(() => previous.click());
  expect(mainChange).not.toHaveBeenCalled();
  expect(container.querySelector("[data-comparison-totals]")?.textContent).toContain(
    "September 2026",
  );
  click("followMainMonth");
  expect(container.querySelector("[data-comparison-totals]")?.textContent).toContain(
    "October 2026",
  );
  expect(mainChange).not.toHaveBeenCalled();
});
it("provides matching ring/legend colors and keyboard-operable distribution slices", () => {
  render();
  click("showAnalysis");
  const circles = [...container.querySelectorAll<SVGCircleElement>('circle[role="button"]')];
  expect(circles).toHaveLength(7);
  expect(new Set(circles.map((c) => c.getAttribute("stroke"))).size).toBeGreaterThan(1);
  const swatch = container.querySelector("li span[style]") as HTMLElement;
  expect(swatch.getAttribute("style")).toContain(circles[0].getAttribute("stroke")!);
  act(() =>
    circles[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
  );
  expect(container.querySelector('circle[aria-pressed="true"]')).not.toBeNull();
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("Category");
});
