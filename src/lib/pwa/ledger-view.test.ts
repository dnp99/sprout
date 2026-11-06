import { expect, it } from "vitest";
import { personalLedgerViewIdentity } from "./ledger-view";

type View = Parameters<typeof personalLedgerViewIdentity>[0];
const view: View = {
  user: { id: "sample" } as View["user"],
  viewMonthKey: "2026-11",
  txnBusinessId: "all",
  txnBusinessPeriod: "month",
  mobileTxnScope: "all",
  mobileTxnAllDates: false,
  searchType: "all",
  txnCategory: "all",
  searchQuery: "",
  searchCategoryIds: [],
  webDateFrom: "",
  webDateTo: "",
  searchAmountMin: "",
  searchAmountMax: "",
};
it("separates every requested filter without depending on record data", () => {
  const base = personalLedgerViewIdentity(view);
  for (const patch of [
    { searchQuery: "market" },
    { viewMonthKey: "2026-10" },
    { txnBusinessId: "studio" },
    { txnBusinessPeriod: "all" },
    { mobileTxnScope: "income" },
    { mobileTxnAllDates: true },
    { searchType: "excluded" },
    { txnCategory: "food" },
    { searchCategoryIds: ["food"] },
    { webDateFrom: "2026-11-01" },
    { webDateTo: "2026-11-02" },
    { searchAmountMin: "10" },
    { searchAmountMax: "20" },
  ] as Partial<View>[])
    expect(personalLedgerViewIdentity({ ...view, ...patch })).not.toBe(base);
  expect(personalLedgerViewIdentity({ ...view })).toBe(base);
});
it("treats category membership order as the same view", () => {
  expect(personalLedgerViewIdentity({ ...view, searchCategoryIds: ["a", "b"] })).toBe(
    personalLedgerViewIdentity({ ...view, searchCategoryIds: ["b", "a"] }),
  );
});
