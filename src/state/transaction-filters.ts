import type { AppState } from "./types";

/** Empty-state recovery matches advanced Reset, keeping query, primary type and
 * selected month under their existing owners. Never touches Group state. */
export function personalAdvancedReset(mobile: boolean): Partial<AppState> {
  return {
    txnCategory: "all",
    txnBusinessId: "all",
    txnBusinessPeriod: "month",
    webDateFrom: "",
    webDateTo: "",
    ...(mobile
      ? {
          searchCategoryIds: [],
          searchCategoryId: "all",
          searchType: "all",
          searchAmountMin: "",
          searchAmountMax: "",
          searchDateFrom: "",
          searchDateTo: "",
          mobileTxnAllDates: false,
        }
      : {
          webTxnCategoryIds: [],
          webTxnQuickType: "all",
          webAmountMin: "",
          webAmountMax: "",
          webSortKey: "date",
          webSortDir: "desc",
        }),
  };
}
