"use client";
import { CategoryOrganizer } from "@/components/shared/CategoryOrganizer";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";

export function GroupCategoryOrganizer({
  data,
  ...props
}: {
  data: GroupSnapshot;
  run: (op: GroupOperation) => Promise<unknown>;
  busy: boolean;
  onDone: () => void;
}) {
  const recordCounts: Record<string, number> = {};
  for (const entry of data.reportEntries ?? data.entries ?? [])
    if (!entry.voidedAt && entry.categoryId)
      recordCounts[entry.categoryId] = (recordCounts[entry.categoryId] ?? 0) + 1;
  return <CategoryOrganizer data={{ ...data, recordCounts }} {...props} />;
}
