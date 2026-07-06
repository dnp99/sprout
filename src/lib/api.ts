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
  excludeFromBudget: boolean;
  /** Also apply this category to every transaction from the same merchant
   *  (past) and cache a rule for future imports. */
  applyToMerchant?: boolean;
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

export interface ProfileInput {
  name: string;
  currency: string;
  budgetCycle: User["budgetCycle"];
}

async function patchMe(body: Record<string, unknown>): Promise<User> {
  const res = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to update profile.");
  }
  return (await res.json()).user;
}

/** Update the signed-in user's profile. */
export const updateProfile = (input: ProfileInput) => patchMe({ ...input });

/** Update just the monthly budget pool (cents). */
export const updateBudgetPoolApi = (budgetPoolCents: number) => patchMe({ budgetPoolCents });

async function writeJson(url: string, method: string, body?: unknown): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed.");
  }
}

export interface GoalInput {
  name: string;
  emoji: string;
  color: string;
  targetCents: number;
  savedCents: number;
  targetDate: string | null;
}

export const createGoal = (input: GoalInput) => writeJson("/api/goals", "POST", input);
export const updateGoalApi = (id: string, input: GoalInput) =>
  writeJson(`/api/goals/${id}`, "PATCH", input);
export const deleteGoalApi = (id: string) => writeJson(`/api/goals/${id}`, "DELETE");

export interface RecurringInput {
  name: string;
  emoji: string;
  amountCents: number;
  dayOfMonth: number;
  paused: boolean;
  categoryId: string | null;
}

export const createRecurring = (input: RecurringInput) =>
  writeJson("/api/recurring", "POST", input);
export const updateRecurringApi = (id: string, input: RecurringInput) =>
  writeJson(`/api/recurring/${id}`, "PATCH", input);
export const deleteRecurringApi = (id: string) => writeJson(`/api/recurring/${id}`, "DELETE");

export interface CategoryInput {
  name: string;
  emoji: string;
  color: string;
  monthlyBudgetCents: number;
}

export const createCategoryApi = (input: CategoryInput) =>
  writeJson("/api/categories", "POST", input);
export const updateCategoryApi = (id: string, input: CategoryInput) =>
  writeJson(`/api/categories/${id}`, "PATCH", input);
export const deleteCategoryApi = (id: string) => writeJson(`/api/categories/${id}`, "DELETE");
