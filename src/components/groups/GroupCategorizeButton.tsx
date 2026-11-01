"use client";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { groupCategoryCandidates } from "@/lib/groups/ai-category-plan";
import type { GroupSnapshot } from "@/lib/groups/dto";
import { useGroupBulk } from "./useGroupBulk";

/** Use the full report ledger so pagination cannot split a refund family. */
export function GroupCategorizeButton({
  data,
  refresh,
  onBusyChange,
  disabled,
}: {
  data: GroupSnapshot;
  refresh: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}) {
  const t = useTranslations("groups");
  const { run, busy, error } = useGroupBulk(data, refresh, onBusyChange);
  const candidates = groupCategoryCandidates(data.reportEntries ?? data.entries);
  if (data.group.archivedAt || !candidates.length || !data.categories.some((c) => !c.archived))
    return null;
  return (
    <div>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() =>
          void run(
            { action: "aiCategory" },
            candidates.map(({ id, version }) => ({ id, version })),
          )
        }
        className="flex min-h-11 items-center gap-2 rounded-[10px] border border-soft-border bg-primary-soft px-4 text-xs font-semibold text-primary disabled:opacity-50"
      >
        <Sparkles size={15} strokeWidth={2} />
        {busy ? t("aiCategorizing") : t("aiCategorize", { count: candidates.length })}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-primary-dark">
          {error}
        </p>
      )}
    </div>
  );
}
