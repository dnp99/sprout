import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  merchant: text("merchant").notNull(),
  // Signed cents: negative = expense, positive = income.
  amountCents: integer("amount_cents").notNull(),
  note: text("note"),
  // "card" | "cash" | "transfer" | ...
  method: text("method").notNull().default("card"),
  // "posted" | "pending"
  status: text("status").notNull().default("posted"),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
