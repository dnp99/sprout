import type { AppState } from "@/state/types";

type PersonalView = Pick<
  AppState,
  | "user"
  | "viewMonthKey"
  | "txnBusinessId"
  | "txnBusinessPeriod"
  | "mobileTxnScope"
  | "mobileTxnAllDates"
  | "searchType"
  | "txnCategory"
  | "searchQuery"
  | "searchCategoryIds"
  | "webDateFrom"
  | "webDateTo"
  | "searchAmountMin"
  | "searchAmountMax"
>;

/** Cache the requested view, never its result rows. Edits and refreshes must not
 * discard the rendered batch; distinct queries with equal counts must not alias. */
export function personalLedgerViewIdentity(state: PersonalView) {
  return JSON.stringify([
    state.user.id,
    state.viewMonthKey,
    state.txnBusinessId,
    state.txnBusinessPeriod,
    state.mobileTxnScope,
    state.mobileTxnAllDates,
    state.searchType,
    state.txnCategory,
    state.searchQuery,
    [...state.searchCategoryIds].sort(),
    state.webDateFrom,
    state.webDateTo,
    state.searchAmountMin,
    state.searchAmountMax,
  ]);
}
