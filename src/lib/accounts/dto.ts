import type { AccountRow } from "@/db/schema";
import type { ConnectedAccount } from "@/lib/types";

const EMOJI_BY_TYPE: Record<string, string> = {
  depository: "🏦",
  credit: "💳",
  loan: "🏛️",
  investment: "📈",
};

/** Map an account row to the app-facing shape. Accounts are created by CSV
 *  import, so there's no live "sync" — we label them as imported. */
export function toConnectedAccount(row: AccountRow): ConnectedAccount {
  return {
    id: row.id,
    name: row.name,
    emoji: EMOJI_BY_TYPE[row.type] ?? "🏦",
    last4: row.mask ?? "",
    syncedLabel: row.institution ?? "Imported",
    status: "Imported",
  };
}
