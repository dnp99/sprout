import type { AppState } from "./types";
/** A Settings drill-down starts clean so unrelated filters cannot hide a business's history. */
export function businessTransactionView(id: string): Partial<AppState> {
  return {
    webView: "transactions",
    mobileScreen: "history",
    txnBusinessId: id,
    txnBusinessPeriod: "all",
    txnCategory: "all",
    webTxnCategoryIds: [],
    webTxnType: "all",
    webTxnQuery: "",
    webDateFrom: "",
    webDateTo: "",
    webAmountMin: "",
    webAmountMax: "",
    searchType: "all",
    mobileTxnScope: "all",
    searchCategoryId: "all",
    searchCategoryIds: [],
    searchQuery: "",
    searchDateFrom: "",
    searchDateTo: "",
    searchAmountMin: "",
    searchAmountMax: "",
  };
}
