"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { RecordedTime } from "@/components/shared/RecordedTime";
import type { GroupEntry } from "@/lib/groups/dto";

/** Recording metadata remains reachable without competing with the payment summary. */
export function GroupEntryDetails({
  entry,
  author,
  compact = false,
}: {
  entry: GroupEntry;
  author: string;
  compact?: boolean;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const updated =
    entry.version > 0 && entry.updatedAt && isFinite(Date.parse(entry.updatedAt))
      ? entry.updatedAt
      : null;
  return (
    <details className={`group/entry-details text-xs text-muted ${compact ? "relative" : "mt-1"}`}>
      <summary
        aria-label={t("recordDetails")}
        className={`cursor-pointer list-none items-center rounded-md font-medium transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden ${compact ? "flex min-h-11 min-w-11 justify-end" : "inline-flex min-h-11 gap-1 pr-2"}`}
      >
        {!compact && t("recordDetails")}
        <span
          className={
            compact
              ? "inline-flex h-6 w-7 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--fg)_9%,var(--card))] text-ink"
              : "contents"
          }
        >
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className="transition-transform group-open/entry-details:rotate-180"
          />
        </span>
      </summary>
      <div
        className={
          compact
            ? "absolute right-0 top-full z-20 w-60 max-w-[calc(100vw-4rem)] space-y-1 rounded-[10px] border border-edge bg-card p-3 text-left text-ink shadow-lg"
            : "space-y-1 border-l border-edge pl-3 pb-1"
        }
      >
        <p>
          {t("recordedBy")} {author}
        </p>
        <RecordedTime value={entry.createdAt} />
        {updated && (
          <p>
            {t("lastEdited")}{" "}
            <time dateTime={updated}>{new Date(updated).toLocaleString(locale)}</time>
          </p>
        )}
      </div>
    </details>
  );
}
