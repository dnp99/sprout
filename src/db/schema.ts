import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Sprout data model.
 *
 * Money is stored as signed integer **cents** (e.g. -6420 = an expense of
 * $64.20, +320000 = income of $3,200) to avoid floating-point rounding. The
 * app layer formats cents into display strings.
 */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  currency: text("currency").notNull().default("CAD"),
  // "monthly" | "weekly" | "biweekly"
  budgetCycle: text("budget_cycle").notNull().default("monthly"),
  // The user's total monthly budget, in cents. This is the single source of
  // truth for "safe to spend"; categories allocate *within* it. 0 = never set
  // (drives the empty hero + "set your budget" onboarding prompt). See plans/007.
  budgetPoolCents: integer("budget_pool_cents").notNull().default(0),
  // bcrypt hash; nullable so the pre-auth seed user can exist without one.
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Random opaque token stored in the session cookie and looked up server-side.
  token: text("token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  // Hex accent for the progress bar / icon, e.g. "#c98a5a".
  color: text("color").notNull(),
  // Monthly budget for this category, in cents.
  monthlyBudgetCents: integer("monthly_budget_cents").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Bank/card/loan accounts a transaction can belong to (populated by import).
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // "depository" | "credit" | "loan" | "investment"
  type: text("type").notNull().default("depository"),
  mask: text("mask"),
  institution: text("institution"),
  currentBalanceCents: integer("current_balance_cents"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    merchant: text("merchant").notNull(),
    // Signed cents: negative = expense, positive = income.
    amountCents: integer("amount_cents").notNull(),
    note: text("note"),
    // "card" | "cash" | "transfer" | ...
    method: text("method").notNull().default("card"),
    // "posted" | "pending"
    status: text("status").notNull().default("posted"),
    // "expense" | "income" | "transfer" | "payment"
    kind: text("kind").notNull().default("expense"),
    // Internal moves (transfers, card/loan payments) are excluded from budget math.
    excludeFromBudget: boolean("exclude_from_budget").notNull().default(false),
    // Set when this row's spare change has been swept into a goal (round-ups),
    // so a later sweep doesn't count it twice. Null = not yet swept.
    roundupSweptAt: timestamp("roundup_swept_at", { withTimezone: true }),
    // Deterministic per-source-row key for repeatable imports (dedupe).
    externalId: text("external_id"),
    // Raw source strings, preserved so category/account mapping can be re-run.
    sourceCategory: text("source_category"),
    sourceAccount: text("source_account"),
    importedAt: timestamp("imported_at", { withTimezone: true }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Repeatable import: one row per (user, source key). Partial so manual
    // (non-imported) transactions with a null external_id aren't constrained.
    uniqueIndex("transactions_user_external_uq")
      .on(table.userId, table.externalId)
      .where(sql`${table.externalId} is not null`),
  ],
);

// Per-merchant category assignments, cached so AI categorization is a one-time
// cost per merchant. Populated by the AI fallback (source 'ai') during import;
// a manual override would be source 'manual'. Looked up before hitting the API.
export const merchantRules = pgTable(
  "merchant_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Normalized merchant string (see normalizeMerchant) — the match key.
    pattern: text("pattern").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    // "ai" | "manual" — where the assignment came from.
    source: text("source").notNull().default("ai"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("merchant_rules_user_pattern_uq").on(table.userId, table.pattern)],
);

// Savings goals (progress toward a target). targetLabel is derived, not stored.
export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  color: text("color").notNull(),
  targetCents: integer("target_cents").notNull(),
  savedCents: integer("saved_cents").notNull().default(0),
  // For the "Dec 2026" label; nullable when a goal has no target date.
  targetDate: date("target_date"),
  // At most one goal per user is the round-up destination (app-enforced).
  isRoundupTarget: boolean("is_roundup_target").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Recurring income + bills. Upcoming bills are derived from the expense rows
// (next due from day_of_month), so there's no separate bills table.
export const recurringItems = pgTable("recurring_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  // Signed cents: negative = bill/expense, positive = income.
  amountCents: integer("amount_cents").notNull(),
  // "monthly" | "weekly" | "yearly"
  cadence: text("cadence").notNull().default("monthly"),
  // Anchor by cadence: monthly → day_of_month; weekly → day_of_week (0=Sun..6=Sat);
  // yearly → month_of_year (1..12) + day_of_month. day_of_month stays NOT NULL
  // (defaults to 1 for weekly, where it's unused).
  dayOfMonth: integer("day_of_month").notNull(),
  dayOfWeek: integer("day_of_week"),
  monthOfYear: integer("month_of_year"),
  paused: boolean("paused").notNull().default(false),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type AccountRow = typeof accounts.$inferSelect;
export type MerchantRuleRow = typeof merchantRules.$inferSelect;
export type GoalRow = typeof goals.$inferSelect;
export type RecurringItemRow = typeof recurringItems.$inferSelect;
