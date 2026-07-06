/** App-facing types. Money is signed integer cents everywhere (negative =
 *  expense, positive = income); only `formatMoney` renders it. */

export interface User {
  id: string;
  name: string;
  greetingName: string;
  email: string;
  currency: string;
  budgetCycle: "monthly" | "weekly" | "biweekly";
  /** Monthly budget pool to allocate across categories, in cents. */
  budgetPoolCents: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  /** Hex accent for the progress bar / icon. */
  color: string;
  monthlyBudgetCents: number;
  /** Spent so far this cycle, in cents (derived). */
  spentCents: number;
}

export interface Transaction {
  id: string;
  merchant: string;
  emoji: string;
  categoryId: string | null;
  categoryName: string;
  /** Signed cents: negative = expense, positive = income. */
  amountCents: number;
  note?: string | null;
  method: string;
  status: "posted" | "pending";
  /** Human label: "Today", "Yesterday", "Jun 12". */
  dateLabel: string;
  /** Longer label for detail view: "Today · 9:24 AM". */
  timeLabel?: string;
  occurredAt: string;
  isIncome: boolean;
  /** Internal move (transfer / card or loan payment) — excluded from budget and
   *  trend spending math. Optional; treated as false when absent. */
  excludeFromBudget?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  savedCents: number;
  targetCents: number;
  /** "Dec 2026" or a status like "Almost there!". */
  targetLabel: string;
  /** ISO date "YYYY-MM-DD" of the target, or null. Used to pre-fill the editor. */
  targetDate: string | null;
  /** Progress-bar accent. */
  color: string;
}

export type Cadence = "monthly" | "weekly" | "yearly";

export interface RecurringItem {
  id: string;
  name: string;
  emoji: string;
  /** Signed cents. */
  amountCents: number;
  cadence: Cadence;
  /** Day of the month (1–31). Anchor for monthly + yearly; unused for weekly. */
  dayOfMonth: number;
  /** Day of week (0=Sun..6=Sat). Anchor for weekly; null otherwise. */
  dayOfWeek: number | null;
  /** Month of year (1–12). Anchor for yearly (with dayOfMonth); null otherwise. */
  monthOfYear: number | null;
  /** Optional linked category (expenses); null for income / uncategorized. */
  categoryId: string | null;
  /** "Monthly · 1st" / "Weekly · Tuesdays" / "Yearly · Mar 15". */
  frequencyLabel: string;
  paused: boolean;
  isIncome: boolean;
}

export interface UpcomingBill {
  id: string;
  name: string;
  emoji: string;
  /** "in 3 days". */
  dueLabel: string;
  amountCents: number;
  /** Due soon → highlight the label. */
  urgent: boolean;
}

export interface ConnectedAccount {
  id: string;
  name: string;
  emoji: string;
  last4: string;
  syncedLabel: string;
  status: string;
}

export interface BudgetSummary {
  safeToSpendCents: number;
  spentCents: number;
  budgetCents: number;
  incomeCents: number;
  savedCents: number;
  daysLeft: number;
  /** "June 2026". */
  monthLabel: string;
}

/** A slice of the spending donut ring. */
export interface DonutSegment {
  color: string;
  /** Share of the ring, in percent. Segments should sum to ~100. */
  pct: number;
}

/** One point in the 6-month spending trend. */
export interface TrendPoint {
  label: string;
  /** Bar height as a 0–100 percentage of the tallest bar. */
  heightPercent: number;
  current?: boolean;
}

export interface TopMover {
  name: string;
  emoji: string;
  deltaCents: number;
}

/** Mobile navigation. The tab bar keys map to primary screens; other screens
 *  are pushed on top. The "+" opens the Add screen. */
export type MobileScreen =
  | "home"
  | "categories"
  | "catDetail"
  | "addCat"
  | "budget"
  | "settings"
  | "search"
  | "trends"
  | "goals"
  | "bills"
  | "addBill"
  | "recurring"
  | "history"
  | "txnDetail"
  | "import"
  | "add";

export type TabKey = "home" | "categories" | "goals" | "bills";

export type WebView =
  "overview" | "transactions" | "categories" | "trends" | "goals" | "bills" | "import" | "settings";

export type AddMode = "expense" | "income";
export type Frequency = "Weekly" | "Monthly" | "Yearly";
export type TxnFilter = "all" | "expense" | "income" | "uncategorized";

/** Auth / onboarding flow. "done" = authenticated, app visible. */
export type FlowStep = "signup" | "login" | "income" | "cats" | "goal" | "done";
