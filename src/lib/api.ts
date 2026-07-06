import type {
  BudgetSummary,
  Category,
  ConnectedAccount,
  Goal,
  RecurringItem,
  Transaction,
  User,
} from "./types";

/** Client-side calls to the app's own API routes. All data is for the single
 *  seeded test user (auth comes later). */

export interface AppData {
  user: User;
  categories: Category[];
  summary: BudgetSummary;
  transactions: Transaction[];
  goals: Goal[];
  recurring: RecurringItem[];
  accounts: ConnectedAccount[];
}

/** Load the user, budget summary, categories and recent transactions. */
export async function fetchAppData(): Promise<AppData> {
  const [summaryRes, txnRes] = await Promise.all([
    fetch("/api/summary"),
    fetch("/api/transactions"),
  ]);
  if (!summaryRes.ok || !txnRes.ok) {
    throw new Error(`API error (${summaryRes.status}/${txnRes.status})`);
  }
  const summaryBody = await summaryRes.json();
  const txnBody = await txnRes.json();
  return {
    user: summaryBody.user,
    categories: summaryBody.categories,
    summary: summaryBody.summary,
    transactions: txnBody.transactions,
    goals: summaryBody.goals ?? [],
    recurring: summaryBody.recurring ?? [],
    accounts: summaryBody.accounts ?? [],
  };
}

export interface NewTransactionInput {
  merchant: string;
  amountCents: number;
  categoryId: string | null;
}

/** Persist a new transaction and return the created row. */
export async function postTransaction(input: NewTransactionInput): Promise<Transaction> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create transaction (${res.status})`);
  return (await res.json()).transaction;
}

export interface EditTransactionInput {
  merchant: string;
  amountCents: number;
  categoryId: string | null;
  note: string | null;
}

/** Update an existing transaction. */
export async function patchTransaction(
  id: string,
  input: EditTransactionInput,
): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to update transaction.");
  }
  return (await res.json()).transaction;
}

/** Delete a transaction. */
export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to delete transaction.");
  }
}
