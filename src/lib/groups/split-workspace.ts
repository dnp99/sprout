import type { GroupEntry } from "./dto";
import { savedSplit, splitEligible } from "./split";

export type SplitDecision = "" | "include" | "exclude";
export type SplitChoice = { key: string; value: SplitDecision };

/** A refund cannot make its unsplit shared-fund original eligible. Saved
 * families remain reviewable so an edit can explicitly remove old debt. */
export function splitWorkspaceFamilies(entries: GroupEntry[]) {
  const families = new Map<string, GroupEntry[]>();
  for (const entry of entries.filter((e) => !e.voidedAt && e.kind !== "income")) {
    const id = entry.refundOf ?? entry.id;
    families.set(id, [...(families.get(id) ?? []), entry]);
  }
  const byEntry = new Map<string, GroupEntry[]>();
  for (const [id, family] of families) {
    const original = family.find((e) => e.id === id && e.kind === "expense");
    if (original ? !splitEligible(original) && !savedSplit(original) : !family.some(splitEligible))
      continue;
    for (const entry of family) byEntry.set(entry.id, family);
  }
  return byEntry;
}

/** Match server inclusion checks. New shared-fund children can be recalculated
 * implicitly with their original; saved children need explicit review choices. */
export function canIncludeSplitEntry(entry: GroupEntry, entries: GroupEntry[]) {
  if (entry.voidedAt || entry.kind === "income") return false;
  const original = entry.refundOf
    ? entries.find((e) => e.id === entry.refundOf && !e.voidedAt)
    : entry;
  return (
    !!original &&
    (splitEligible(original) || !!savedSplit(original)) &&
    (splitEligible(entry) || !!savedSplit(entry))
  );
}

/** Version and saved-result changes anywhere in a family invalidate its draft
 * decision, while a range or filter change does not. */
export function splitChoiceKey(family: GroupEntry[]) {
  return JSON.stringify(family.map((e) => [e.id, e.version, savedSplit(e)]));
}

export function splitDecision(family: GroupEntry[], choice?: SplitChoice): SplitDecision {
  if (choice?.key === splitChoiceKey(family)) return choice.value;
  if (family.some((e) => savedSplit(e)?.review === "pending")) return "";
  if (family.some((e) => savedSplit(e)?.review === "excluded")) return "exclude";
  return "include";
}

export function splitRecordStatus(entry: GroupEntry) {
  const saved = savedSplit(entry);
  return !saved
    ? "new"
    : saved.review === "pending"
      ? "changed"
      : saved.review === "excluded"
        ? "kept"
        : "calculated";
}
