import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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
  currency: text("currency").notNull().default("USD"),
  // "monthly" | "weekly" | "biweekly"
  budgetCycle: text("budget_cycle").notNull().default("monthly"),
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

export type UserRow = typeof users.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type AccountRow = typeof accounts.$inferSelect;
