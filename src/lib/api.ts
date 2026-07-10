import type {
  BudgetSummary,
  Cadence,
  Category,
  Goal,
  RecurringItem,
  Transaction,
  User,
} from "./types";

/** Client-side calls to the app's own API routes. All data is for the single
 *  seeded test user (auth comes later). */

/** Everything except transactions — the light, fast payload that paints the
 *  dashboard shell (budget hero, goals, bills, category budgets). */
export interface SummaryData {
  user: User;
  categories: Category[];
  summary: BudgetSummary;
  goals: Goal[];
  recurring: RecurringItem[];
}

/** Phase 1 of the two-phase load: the fast summary payload. */
export async function fetchSummary(): Promise<SummaryData> {
  const res = await fetch("/api/summary");
  if (!res.ok) throw new Error(`Summary API error (${res.status})`);
  const body = await res.json();
  return {
    user: body.user,
    categories: body.categories,
    summary: body.summary,
    goals: body.goals ?? [],
    recurring: body.recurring ?? [],
  };
}

/** Phase 2: the (potentially large) transaction set, loaded in the background. */
export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions");
  if (!res.ok) throw new Error(`Transactions API error (${res.status})`);
  return (await res.json()).transactions;
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
  /** New date (ISO / "YYYY-MM-DD"). Omit to keep the existing date. */
  occurredAt?: string;
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

/** Bulk-assign a category (or null to clear) to many transactions. Returns the
 *  number of rows updated. */
export async function bulkCategorizeApi(ids: string[], categoryId: string | null): Promise<number> {
  const res = await fetch("/api/transactions/categorize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ids, categoryId }),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't categorize.");
  }
  return (await res.json()).count;
}

/** Bulk-delete transactions. Returns the number of rows deleted. */
export async function bulkDeleteApi(ids: string[]): Promise<number> {
  const res = await fetch("/api/transactions/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't delete.");
  }
  return (await res.json()).count;
}

export interface ProfileInput {
  name: string;
  currency: string;
  budgetCycle: User["budgetCycle"];
  budgetPoolCents?: number;
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
  isRoundupTarget: boolean;
}

export const createGoal = (input: GoalInput) => writeJson("/api/goals", "POST", input);
export const updateGoalApi = (id: string, input: GoalInput) =>
  writeJson(`/api/goals/${id}`, "PATCH", input);
export const deleteGoalApi = (id: string) => writeJson(`/api/goals/${id}`, "DELETE");

export interface RoundupSweepResult {
  sweptCents: number;
  goalId: string | null;
}

/** Sweep available round-ups into the designated goal. */
export async function sweepRoundupsApi(): Promise<RoundupSweepResult> {
  const res = await fetch("/api/goals/roundups/sweep", { method: "POST" });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't sweep round-ups.");
  }
  return (await res.json()).result;
}

export interface RecurringInput {
  name: string;
  emoji: string;
  amountCents: number;
  cadence: Cadence;
  dayOfMonth: number;
  dayOfWeek: number | null;
  monthOfYear: number | null;
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

export interface BacklogResult {
  /** Distinct merchant patterns considered. */
  patterns: number;
  /** Patterns resolved to a category (cached rule or AI). */
  resolved: number;
  /** Transactions given a category. */
  applied: number;
}

/** Run AI categorization over the uncategorized backlog. Throws with the
 *  server's message (e.g. no API key) on failure. */
export async function categorizeBacklogApi(): Promise<BacklogResult> {
  const res = await fetch("/api/transactions/categorize-backlog", { method: "POST" });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't categorize backlog.");
  }
  return (await res.json()).result;
}

export const createCategoryApi = (input: CategoryInput) =>
  writeJson("/api/categories", "POST", input);
export const updateCategoryApi = (id: string, input: CategoryInput) =>
  writeJson(`/api/categories/${id}`, "PATCH", input);
export const deleteCategoryApi = (id: string) => writeJson(`/api/categories/${id}`, "DELETE");

// --- Ingest tokens (Connected apps: Siri Shortcut / scripts) — plan 008 -------

/** A token as shown in the management list (never the raw token or its hash). */
export interface ApiTokenSummary {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

/** The one-time create response — `token` is the raw secret, shown once. */
export interface CreatedApiToken {
  id: string;
  token: string;
  prefix: string;
}

export async function fetchApiTokens(): Promise<ApiTokenSummary[]> {
  const res = await fetch("/api/tokens");
  if (!res.ok) throw new Error(`Tokens API error (${res.status})`);
  return (await res.json()).tokens;
}

export async function createApiTokenReq(name: string): Promise<CreatedApiToken> {
  const res = await fetch("/api/tokens", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't create token.");
  }
  return (await res.json()).token;
}

export const revokeApiTokenReq = (id: string) => writeJson(`/api/tokens/${id}`, "DELETE");

/** A one-time WhatsApp link code + the number to text it to. */
export interface WhatsappLink {
  code: string;
  number: string | null;
}

export async function createWhatsappLinkReq(): Promise<WhatsappLink> {
  const res = await fetch("/api/channels/whatsapp/link", { method: "POST" });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't create a link code.");
  }
  return res.json();
}
