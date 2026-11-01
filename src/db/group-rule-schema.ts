import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { groups, groupCategories } from "./group-schema";

/** Group-owned rules survive individual member departures and never enter Personal rules. */
export const groupMerchantRules = pgTable(
  "group_merchant_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    pattern: text("pattern").notNull(),
    label: text("label").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => groupCategories.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("group_merchant_rules_group_pattern_uq").on(t.groupId, t.pattern)],
);
