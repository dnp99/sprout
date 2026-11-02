import { expect, it } from "vitest";
import { businessTransactionView } from "./business-view";
import { transactionLocation } from "@/lib/transaction-location";
import { sanitizeFilters } from "@/lib/views/types";
it("opens all dates and clears unrelated filters on both surfaces", () => {
  expect(businessTransactionView("maple")).toMatchObject({
    txnBusinessId: "maple",
    txnBusinessPeriod: "all",
    webView: "transactions",
    mobileScreen: "history",
    webTxnQuery: "",
    webDateFrom: "",
    searchQuery: "",
    searchCategoryIds: [],
  });
});
it("encodes drill-down URLs and keeps business scopes in saved views", () => {
  const path = transactionLocation("food & drink", "maple", "all");
  const params = new URL(path, "http://localhost").searchParams;
  expect(params.get("business")).toBe("maple");
  expect(params.get("scope")).toBe("all");
  expect(params.get("cat")).toBe("food & drink");
  expect(transactionLocation("all", "all", "all")).toBe("/transactions");
  expect(
    sanitizeFilters({ businessId: "maple", businessPeriod: "all", privateField: "drop" }),
  ).toEqual({ businessId: "maple", businessPeriod: "all" });
});

it("preserves the mobile primary transaction scope in saved business views", () => {
  expect(
    sanitizeFilters({ businessId: "maple", businessPeriod: "all", transactionScope: "income" }),
  ).toEqual({ businessId: "maple", businessPeriod: "all", transactionScope: "income" });
});
