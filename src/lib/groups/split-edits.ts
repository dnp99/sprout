import { eq } from "drizzle-orm";
import { groupSplitResults } from "@/db/schema";
import type { GroupTx } from "./context";
import type { GroupEntry, SplitSnapshot } from "./dto";
import { financialEdit, savedSplit } from "./split";

/** Every original-edit path must retain the old financial basis before mutation,
 * including bulk category/date changes and reviewed category merges. */
export async function reviewSplitEdit(
  tx: GroupTx,
  groupId: string,
  before: GroupEntry,
  after: SplitSnapshot,
  includeNextSplit = true,
) {
  const prior = savedSplit(before);
  if (!prior || !financialEdit(before, after)) return;
  const review = includeNextSplit ? "pending" : "excluded";
  await tx
    .insert(groupSplitResults)
    .values({
      entryId: before.id,
      groupId,
      snapshot: prior.snapshot,
      review,
      reviewedVersion: before.version + 1,
      calculatedAt: new Date(prior.calculatedAt),
    })
    .onConflictDoUpdate({
      target: groupSplitResults.entryId,
      set: { review, reviewedVersion: before.version + 1 },
    });
}
