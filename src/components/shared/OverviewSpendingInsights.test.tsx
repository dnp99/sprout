import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OverviewSpendingInsights } from "./OverviewSpendingInsights";

const state = vi.hoisted(() => ({
  transactions: [],
  categories: [],
  user: { id: "a", name: "A" },
  locale: "en-CA",
  viewMonthKey: "2026-10",
  transactionsLoading: false,
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (value: typeof state) => unknown) => select(state),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("keeps reporting period visible and toggles secondary controls as one accessible region", () => {
  act(() => root.render(<OverviewSpendingInsights />));
  const toggle = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
    (el) => el.textContent === "reportFilters",
  )!;
  const region = document.getElementById(toggle.getAttribute("aria-controls")!)!;
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(region.classList.contains("hidden")).toBe(true);
  expect(container.textContent).toContain("reportPeriod");
  expect(region.textContent).not.toContain("reportPeriod");
  expect(region.querySelector('[aria-label="payerFilter"]')).not.toBeNull();
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(region.classList.contains("hidden")).toBe(false);
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(container.textContent).toContain("allPayers");
});
