import { expect, it } from "vitest";
import { personalAdvancedReset } from "./transaction-filters";
it.each([false, true])(
  "advanced reset preserves primary/query/month and isolates ledger state (mobile=%s)",
  (mobile) => {
    const reset = personalAdvancedReset(mobile);
    expect(reset).not.toHaveProperty("viewMonthKey");
    expect(reset).not.toHaveProperty("mobileTxnScope");
    expect(reset).not.toHaveProperty("webTxnType");
    expect(reset).not.toHaveProperty("searchQuery");
    expect(reset).not.toHaveProperty("webTxnQuery");
    expect(reset).not.toHaveProperty("groups");
    expect(reset).toMatchObject({ txnCategory: "all", webDateFrom: "", webDateTo: "" });
  },
);
