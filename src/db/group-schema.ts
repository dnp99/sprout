import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./schema";

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Separate ownership keeps household data outside personal-data cascades. */
export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("CAD"),
  revision: integer("revision").notNull().default(0),
  splitMethod: text("split_method").notNull().default("equal"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps(),
});
export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    role: text("role").notNull().default("member"),
    status: text("status").notNull().default("active"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("group_members_group_user_uq").on(t.groupId, t.userId),
    index("group_members_user_idx").on(t.userId),
    uniqueIndex("group_members_owner_uq")
      .on(t.groupId)
      .where(sql`${t.role} = 'owner' AND ${t.status} = 'active'`),
  ],
);
export const groupInvites = pgTable("group_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => groupMembers.id),
  reactivateMemberId: uuid("reactivate_member_id").references(() => groupMembers.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const groupCategories = pgTable(
  "group_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => groupCategories.id),
    sortOrder: integer("sort_order").notNull().default(0),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    color: text("color").notNull(),
    archived: boolean("archived").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index("group_categories_group_idx").on(t.groupId),
    index("group_categories_parent_idx").on(t.groupId, t.parentId),
    check("group_category_not_own_parent", sql`${t.parentId} IS NULL OR ${t.parentId} <> ${t.id}`),
  ],
);
export const groupBudgets = pgTable(
  "group_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    poolCents: integer("pool_cents").notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("group_budgets_month_uq").on(t.groupId, t.month),
    check("group_budget_nonnegative", sql`${t.poolCents} >= 0`),
  ],
);
export const groupBudgetAllocations = pgTable(
  "group_budget_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => groupBudgets.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => groupCategories.id),
    amountCents: integer("amount_cents").notNull(),
  },
  (t) => [
    uniqueIndex("group_budget_category_uq").on(t.budgetId, t.categoryId),
    check("group_allocation_nonnegative", sql`${t.amountCents} >= 0`),
  ],
);
export const groupEntries = pgTable(
  "group_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => groupMembers.id),
    payerId: uuid("payer_id").references(() => groupMembers.id),
    categoryId: uuid("category_id").references(() => groupCategories.id),
    kind: text("kind").notNull(),
    amountCents: integer("amount_cents").notNull(),
    merchant: text("merchant").notNull(),
    note: text("note").notNull().default(""),
    occurredOn: date("occurred_on").notNull(),
    refundOf: uuid("refund_of"),
    settlement: boolean("settlement").notNull().default(true),
    splitMethod: text("split_method").notNull().default("equal"),
    recurringItemId: uuid("recurring_item_id").references(
      (): AnyPgColumn => groupRecurringItems.id,
      { onDelete: "set null" },
    ),
    roundupSweptAt: timestamp("roundup_swept_at", { withTimezone: true }),
    version: integer("version").notNull().default(0),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("group_entries_date_idx").on(t.groupId, t.occurredOn),
    index("group_entries_refund_idx").on(t.refundOf),
    check(
      "group_entry_sign",
      sql`(${t.kind} = 'expense' AND ${t.amountCents} < 0) OR (${t.kind} IN ('income', 'refund') AND ${t.amountCents} > 0)`,
    ),
  ],
);
export const groupEntryShares = pgTable(
  "group_entry_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => groupEntries.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => groupMembers.id),
    amountCents: integer("amount_cents").notNull(),
    weight: integer("weight").notNull(),
  },
  (t) => [
    uniqueIndex("group_entry_member_uq").on(t.entryId, t.memberId),
    check("group_share_nonnegative", sql`${t.amountCents} >= 0 AND ${t.weight} >= 0`),
  ],
);
export const groupRepayments = pgTable(
  "group_repayments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => groupMembers.id),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => groupMembers.id),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => groupMembers.id),
    amountCents: integer("amount_cents").notNull(),
    occurredOn: date("occurred_on").notNull(),
    note: text("note").notNull().default(""),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    reversalReason: text("reversal_reason"),
    reversedBy: uuid("reversed_by").references(() => groupMembers.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("group_repayments_date_idx").on(t.groupId, t.occurredOn),
    check("group_repayment_valid", sql`${t.amountCents} > 0 AND ${t.senderId} <> ${t.recipientId}`),
  ],
);
export const groupActivity = pgTable(
  "group_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => groupMembers.id),
    action: text("action").notNull(),
    entityId: uuid("entity_id"),
    detail: jsonb("detail").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("group_activity_group_idx").on(t.groupId, t.createdAt)],
);
export const groupMutations = pgTable(
  "group_mutations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => groupMembers.id),
    key: uuid("key").notNull(),
    payloadHash: text("payload_hash").notNull(),
    result: jsonb("result").notNull(),
  },
  (t) => [uniqueIndex("group_mutations_actor_key_uq").on(t.groupId, t.actorId, t.key)],
);

/** Durable per-account invite throttling works across serverless instances. */
export const groupInviteAttempts = pgTable(
  "group_invite_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("group_invite_attempts_user_date_idx").on(t.userId, t.createdAt)],
);

/** Future-entry split defaults; past allocations are never recalculated. */
export const groupSplitDefaults = pgTable(
  "group_split_defaults",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => groupMembers.id),
    weight: integer("weight").notNull(),
  },
  (t) => [
    uniqueIndex("group_split_defaults_member_uq").on(t.groupId, t.memberId),
    check("group_split_weight_valid", sql`${t.weight} >= 0 AND ${t.weight} <= 10000`),
  ],
);

/** An absent category rule inherits the group default; saved entries retain their shares. */
export const groupCategorySplits = pgTable(
  "group_category_splits",
  {
    categoryId: uuid("category_id")
      .primaryKey()
      .references(() => groupCategories.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    method: text("method").notNull(),
  },
  (t) => [
    index("group_category_splits_group_idx").on(t.groupId),
    check("group_category_split_method", sql`${t.method} IN ('equal', 'percentage')`),
  ],
);
export const groupCategorySplitWeights = pgTable(
  "group_category_split_weights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => groupCategorySplits.categoryId, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => groupMembers.id),
    weight: integer("weight").notNull(),
  },
  (t) => [
    uniqueIndex("group_category_split_member_uq").on(t.categoryId, t.memberId),
    check("group_category_split_weight_valid", sql`${t.weight} >= 0 AND ${t.weight} <= 10000`),
  ],
);

/** Independent latest calculation plus revision-scoped edit acknowledgement.
 * Original ledger rows and real repayments remain separate accounting facts. */
export const groupSplitResults = pgTable("group_split_results", {
  entryId: uuid("entry_id")
    .primaryKey()
    .references(() => groupEntries.id, { onDelete: "cascade" }),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot")
    .$type<{
      amountCents: number;
      categoryId: string | null;
      payerId: string | null;
      occurredOn: string;
      kind: string;
      settlement: boolean;
      shares: { memberId: string; amountCents: number; weight: number }[];
    }>()
    .notNull(),
  review: text("review").notNull().default("current"),
  reviewedVersion: integer("reviewed_version").notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Household plans are owned by the group, never by an individual member. */
export const groupGoals = pgTable("group_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  color: text("color").notNull(),
  targetCents: integer("target_cents").notNull(),
  savedCents: integer("saved_cents").notNull().default(0),
  targetDate: date("target_date"),
  isRoundupTarget: boolean("is_roundup_target").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps(),
});
export const groupRecurringItems = pgTable("group_recurring_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  amountCents: integer("amount_cents").notNull(),
  cadence: text("cadence").notNull().default("monthly"),
  dayOfMonth: integer("day_of_month").notNull(),
  dayOfWeek: integer("day_of_week"),
  monthOfYear: integer("month_of_year"),
  paused: boolean("paused").notNull().default(false),
  categoryId: uuid("category_id").references(() => groupCategories.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps(),
});
