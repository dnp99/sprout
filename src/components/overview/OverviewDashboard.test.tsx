import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GroupOverview } from "@/components/groups/GroupOverview";
import { PersonalOverview } from "./PersonalOverview";
import { SpendingPreview } from "./SpendingPreview";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { Transaction, Category } from "@/lib/types";
import { formatMoney } from "@/lib/format";

const capture = vi.hoisted(() => ({
  set: vi.fn(),
  goMobile: vi.fn(),
  month: "",
  rows: [] as Transaction[],
}));
vi.mock("next-intl", () => ({
  useTranslations: () => Object.assign((key: string) => key, { rich: (key: string) => key }),
}));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({ locale: "en-CA", money: formatMoney, monthKey: (key: string) => key }),
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (state: unknown) => unknown) =>
    select({
      summary: {
        budgetCents: 100000,
        spentCents: 10000,
        incomeCents: 50000,
        savedCents: 40000,
        safeToSpendCents: 90000,
        daysLeft: 10,
      },
      viewMonthKey: capture.month,
      transactions: capture.rows,
      transactionsLoading: false,
      categories: [],
      recurring: [],
      set: capture.set,
      goMobile: capture.goMobile,
    }),
}));
vi.mock("@/components/shared/useActivationItems", () => ({ useActivationItems: () => [] }));
vi.mock("@/components/shared/PersonalCalendar", () => ({
  PersonalCalendar: ({ month }: { month?: string }) => <div data-personal-calendar={month ?? ""} />,
}));
vi.mock("@/components/groups/GroupCalendar", () => ({
  GroupCalendar: ({ data }: { data: GroupSnapshot }) => <div data-group-calendar={data.group.id} />,
}));
let host: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  capture.month = "";
  capture.rows = [];
  capture.set.mockClear();
  capture.goMobile.mockClear();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const group = (id: string, spending: number, exists = true) =>
  ({
    group: { id },
    members: [{ id: "alex", name: "Alex" }],
    categories: [
      {
        id: "food",
        name: "Food",
        parentId: null,
        emoji: "",
        color: "var(--primary)",
        archived: false,
      },
    ],
    summary: { spendingCents: spending, incomeCents: 50000, categorySpending: { food: spending } },
    budget: { exists, poolCents: 100000, allocations: {} },
    entries: [],
    calendarEntries: [],
    reportEntries: [
      {
        id: `${id}-row`,
        kind: "expense",
        categoryId: "food",
        payerId: "alex",
        merchant: `${id} Market`,
        occurredOn: "2026-11-10",
        amountCents: -spending,
        voidedAt: null,
      },
    ],
  }) as unknown as GroupSnapshot;
it("keeps Group summary and widgets tied to the supplied group, including missing budgets", () => {
  const viewAll = vi.fn(),
    explore = vi.fn(),
    budget = vi.fn();
  const render = (data: GroupSnapshot) =>
    act(() =>
      root.render(
        <GroupOverview
          data={data}
          month="2026-11"
          onMonthChange={vi.fn()}
          loading={false}
          busy={false}
          onEdit={vi.fn()}
          onViewAll={viewAll}
          onExplore={explore}
          onBudget={budget}
        />,
      ),
    );
  render(group("maple", 12000));
  expect(host.querySelector('[aria-label="householdSpending"]')?.textContent).toContain("$120");
  expect(host.querySelector("[data-group-calendar]")?.getAttribute("data-group-calendar")).toBe(
    "maple",
  );
  expect(host.querySelector("[data-personal-calendar]")).toBeNull();
  render(group("cedar", 25000, false));
  expect(host.querySelector('[aria-label="householdSpending"]')?.textContent).toContain("$250");
  expect(host.querySelector('[aria-label="sharedRemaining"]')?.textContent).toContain("notSet");
  expect(host.textContent).not.toContain("maple Market");
  act(() =>
    [...host.querySelectorAll("button")].find((b) => b.textContent === "exploreTrends")!.click(),
  );
  expect(explore).toHaveBeenCalledOnce();
  expect(capture.set).not.toHaveBeenCalled();
});
it.each([false, true])(
  "Personal navigation preserves the independently-owned Trends period (mobile=%s)",
  (mobile) => {
    act(() => root.render(<PersonalOverview mobile={mobile} />));
    expect(host.querySelector('[aria-label="spending"]')?.textContent).toContain("$100");
    expect(host.querySelector('[aria-label="yoursToSpend"]')?.textContent).toContain("$900");
    act(() =>
      [...host.querySelectorAll("button")].find((b) => b.textContent === "exploreTrends")!.click(),
    );
    if (mobile) expect(capture.goMobile).toHaveBeenCalledWith("trends");
    else expect(capture.set).toHaveBeenCalledWith({ webView: "trends" });
  },
);
it("uses the established signed comparison engine for a full month, with only three category rows", () => {
  const transaction = (
    id: string,
    categoryId: string,
    amountCents: number,
    date: string,
    kind = "expense",
  ) =>
    ({
      id,
      categoryId,
      categoryName: categoryId,
      amountCents,
      isIncome: false,
      kind,
      occurredAt: `${date}T12:00:00Z`,
      merchant: id,
      excludeFromBudget: false,
    }) as Transaction;
  const categories = ["food", "rent", "travel", "books"].map((id) => ({
    id,
    name: id,
    color: "var(--primary)",
  })) as Category[];
  act(() =>
    root.render(
      <SpendingPreview
        month="2026-11"
        categories={categories}
        transactions={[
          transaction("food", "food", -10000, "2026-11-01"),
          transaction("refund", "food", 2000, "2026-11-02", "reimbursement"),
          transaction("rent", "rent", -5000, "2026-11-01"),
          transaction("future", "travel", -3000, "2026-11-29"),
          transaction("book", "books", -1000, "2026-11-03"),
        ]}
        loading={false}
        onExplore={vi.fn()}
      />,
    ),
  );
  expect(host.querySelector(".dashboard-budget-value")?.textContent).toBe("$170");
  expect(host.querySelectorAll(".dashboard-category-preview > li")).toHaveLength(3);
  expect(host.querySelector("[class*=comparison-chart]")).toBeNull();
});

it("Personal Overview uses the chosen month, without live coaching on historical totals", () => {
  capture.month = "2026-09";
  capture.rows = [
    {
      occurredAt: "2026-09-01T12:00:00Z",
      amountCents: -12000,
      isIncome: false,
      excludeFromBudget: false,
      merchant: "Maple Cafe",
      categoryId: null,
      categoryName: "",
    },
  ] as Transaction[];
  act(() => root.render(<PersonalOverview />));
  expect(host.querySelector('[aria-label="spending"]')?.textContent).toContain("$120");
  expect(host.querySelector('[aria-label="budgetRemaining"]')?.textContent).toContain("$880");
  expect(
    host.querySelector("[data-personal-calendar]")?.getAttribute("data-personal-calendar"),
  ).toBe("2026-09");
  expect(host.textContent).toContain("currentBudgetScope");
  expect(host.textContent).not.toContain("daysLeft");
});
