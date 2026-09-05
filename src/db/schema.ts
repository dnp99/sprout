import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
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

// Password recovery is intentionally separate from sessions: the raw token only
// ever reaches the recipient's email, while this table keeps its one-way hash.
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("password_reset_tokens_user_idx").on(table.userId)],
);

// Hashed email/IP pairs are enough to enforce reset-request limits without
// retaining the raw identifiers in a security-log table.
export const passwordResetRequests = pgTable(
  "password_reset_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    emailHash: text("email_hash").notNull(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("password_reset_requests_email_created_idx").on(table.emailHash, table.createdAt),
    index("password_reset_requests_ip_created_idx").on(table.ipHash, table.createdAt),
  ],
);

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
    // Exact recurring reconciliation link. It is intentionally optional because
    // imported and one-off transactions do not belong to a schedule.
    recurringItemId: uuid("recurring_item_id").references(() => recurringItems.id, {
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
    // "expense" | "income" | "transfer" | "payment"
    kind: text("kind").notNull().default("expense"),
    // Internal moves (transfers, card/loan payments) are excluded from budget math.
    excludeFromBudget: boolean("exclude_from_budget").notNull().default(false),
    // Set when this row's spare change has been swept into a goal (round-ups),
    // so a later sweep doesn't count it twice. Null = not yet swept.
    roundupSweptAt: timestamp("roundup_swept_at", { withTimezone: true }),
    // Deterministic per-source-row key for repeatable imports (dedupe).
    externalId: text("external_id"),
    // Where the row came from: null/'manual' = in-app add, 'import' = CSV,
    // 'whatsapp' | 'siri' = external capture. Lets a later CSV import reconcile
    // against a prior channel capture instead of double-counting (plans/008).
    source: text("source"),
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
    // Human-readable merchant text for display in the rules manager (the raw
    // merchant as typed/last seen); the normalized `pattern` is the match key.
    label: text("label"),
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

// ---------------------------------------------------------------------------
// External capture (plan 008): non-cookie auth for machines. Bearer tokens for
// the Siri Shortcut / scripts, a phone→user binding for WhatsApp, and one-time
// codes to establish that binding.
// ---------------------------------------------------------------------------

// Bearer tokens for the Shortcut / any script. Scoped 'ingest' (create-only,
// not a full-API key), hashed with sha256 (never stored raw), revocable.
export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // sha256(token) — indexed exact-match lookup per request.
  tokenHash: text("token_hash").notNull().unique(),
  // First 8 chars, for display ("sprt_a1b2…").
  tokenPrefix: text("token_prefix").notNull(),
  scope: text("scope").notNull().default("ingest"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Maps an external channel id (a WhatsApp phone) to a Sprout user. last_ingest_*
// is the pointer a bare "U"/"E" reply acts on, so undo hits the right row even
// with multiple captures or out-of-order replies (plans/008).
export const channelIdentities = pgTable(
  "channel_identities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // 'whatsapp'
    channel: text("channel").notNull(),
    // E.164 phone, e.g. '+14155550123'.
    externalId: text("external_id").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    // The most recent capture a follow-up reply undoes/edits; cleared after an
    // undo so a second "U" is a no-op.
    lastIngestId: uuid("last_ingest_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
    lastIngestAt: timestamp("last_ingest_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("channel_identities_channel_external_uq").on(table.channel, table.externalId),
  ],
);

// One-time codes shown in-app to bind a phone to a user (text "link SPRT-4K9Q").
export const channelLinkCodes = pgTable("channel_link_codes", {
  code: text("code").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Saved views (plan 017 B2): a named, serialized Transactions filter set the
// user can recall in one click. Stored server-side so views sync across devices.
export const savedViews = pgTable("saved_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // Serialized filter set ({ type, categoryId, query, dateFrom, dateTo,
  // amountMin, amountMax, sortKey, sortDir }); shape validated at the edge.
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type SavedViewRow = typeof savedViews.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;
export type AccountRow = typeof accounts.$inferSelect;
export type MerchantRuleRow = typeof merchantRules.$inferSelect;
export type GoalRow = typeof goals.$inferSelect;
export type RecurringItemRow = typeof recurringItems.$inferSelect;
export type ApiTokenRow = typeof apiTokens.$inferSelect;
export type ChannelIdentityRow = typeof channelIdentities.$inferSelect;
export type ChannelLinkCodeRow = typeof channelLinkCodes.$inferSelect;
