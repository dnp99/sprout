"use client";
import { useMemo, useState } from "react";
import { compareRecordOrder } from "@/lib/record-order";
import { balances } from "@/lib/groups/accounting";
import {
  calculateSplit,
  calculatedEntries,
  equalWeights,
  savedSplit,
  snapshotSplitRules,
} from "@/lib/groups/split";
import { inSplitRanges, type SplitRange } from "@/lib/groups/split-range";
import {
  canIncludeSplitEntry,
  splitChoiceKey,
  splitDecision,
  splitRecordStatus,
  splitWorkspaceFamilies,
  type SplitChoice,
  type SplitDecision,
} from "@/lib/groups/split-workspace";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperationRunner } from "./settlement-types";

/** Draft choices are scoped to a family's financial version, never a date filter
 * or component mount. Preview approval also includes the group revision. */
export function useSplitWorkspace(
  data: GroupSnapshot,
  ranges: SplitRange[],
  attention: boolean,
  run: GroupOperationRunner,
) {
  const entries = data.reportEntries ?? data.entries;
  const families = useMemo(() => splitWorkspaceFamilies(entries), [entries]);
  const [choices, setChoices] = useState<Record<string, SplitChoice>>({});
  const [reviewKey, setReviewKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const familyId = (entry: GroupEntry) => entry.refundOf ?? entry.id;
  const decision = (e: GroupEntry) =>
    splitDecision(families.get(e.id) ?? [e], choices[familyId(e)]);
  const seeds = entries.filter(
    (e) =>
      families.has(e.id) &&
      (attention
        ? ["new", "changed"].includes(splitRecordStatus(e))
        : inSplitRanges(e.occurredOn, ranges)),
  );
  const ids = new Set(seeds.flatMap((e) => families.get(e.id)!.map((r) => r.id)));
  const rows = entries
    .filter((e) => ids.has(e.id))
    .sort(
      (a, b) =>
        Number(splitRecordStatus(b) === "changed") - Number(splitRecordStatus(a) === "changed") ||
        compareRecordOrder({ ...a, date: a.occurredOn }, { ...b, date: b.occurredOn }),
    );
  const choose = (records: GroupEntry[], value: SplitDecision) => {
    setError("");
    setChoices((old) => ({
      ...old,
      ...Object.fromEntries(
        records.map((e) => [familyId(e), { key: splitChoiceKey(families.get(e.id)!), value }]),
      ),
    }));
  };
  const included = rows.filter((e) => decision(e) === "include");
  const unresolved = rows.filter((e) => decision(e) === "");
  const kept = rows.filter((e) => decision(e) === "exclude" && savedSplit(e));
  const skipped = rows.filter((e) => decision(e) === "exclude" && !savedSplit(e));
  const preview: ReturnType<typeof calculateSplit> = new Map();
  const blockers: { entry: GroupEntry; message: string }[] = [];
  const baseline =
    data.splitDefaults.method === "equal"
      ? equalWeights(data.members)
      : data.splitDefaults.participants;
  // Independent families have independent allocations. Calculating them separately
  // preserves the same cents while identifying exactly which family needs repair.
  for (const id of new Set(included.map(familyId))) {
    const record = included.find((e) => familyId(e) === id)!;
    try {
      const result = calculateSplit(
        entries,
        [record.id],
        data.categories,
        snapshotSplitRules(data),
        baseline,
      );
      for (const [entryId, snapshot] of result) preview.set(entryId, snapshot);
    } catch (e) {
      blockers.push({ entry: record, message: e instanceof Error ? e.message : String(e) });
    }
  }
  const projected = entries.map((e) =>
    preview.has(e.id)
      ? {
          ...e,
          splitResult: {
            snapshot: preview.get(e.id)!,
            review: "current" as const,
            reviewedVersion: e.version,
            calculatedAt: "",
          },
        }
      : e,
  );
  const nextBalance = balances(calculatedEntries(projected), data.repayments);
  const validRanges =
    attention || (ranges.length > 0 && ranges.every((r) => r.from && r.to && r.from <= r.to));
  const needsRules = included.length > 0 && !data.splitDefaults.valid;
  const eligible =
    validRanges &&
    rows.length > 0 &&
    !unresolved.length &&
    !blockers.length &&
    !needsRules &&
    (included.length > 0 || kept.length > 0);
  const token = JSON.stringify([
    data.group.revision,
    ranges,
    attention,
    rows.map((e) => [e.id, e.version, decision(e), splitChoiceKey(families.get(e.id)!)]),
  ]);
  const dirty = Object.entries(choices).some(([id, choice]) => {
    const family = [...families.values()].find((f) => familyId(f[0]) === id);
    return family && choice.key === splitChoiceKey(family);
  });
  const apply = async () => {
    if (!eligible || data.group.archivedAt || reviewKey !== token) return;
    try {
      const selected = rows.filter((e) =>
        decision(e) === "include" ? canIncludeSplitEntry(e, entries) : !!savedSplit(e),
      );
      const result = await run({
        type: "split",
        entries: selected.map((e) => ({
          id: e.id,
          version: e.version,
          decision: decision(e) as "include" | "exclude",
        })),
      });
      if (result) {
        setReviewKey(null);
        setError("");
        const applied = new Set(rows.map(familyId));
        setChoices((old) =>
          Object.fromEntries(Object.entries(old).filter(([id]) => !applied.has(id))),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return {
    rows,
    families,
    decision,
    choose,
    included,
    unresolved,
    kept,
    skipped,
    preview,
    nextBalance,
    blockers,
    error,
    validRanges,
    needsRules,
    eligible,
    dirty,
    apply,
    extra: rows.filter((e) => !attention && !inSplitRanges(e.occurredOn, ranges)).length,
    reviewing: reviewKey === token,
    review: () => setReviewKey(token),
    closeReview: () => setReviewKey(null),
  };
}
