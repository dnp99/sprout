"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { RecordedTime } from "@/components/shared/RecordedTime";
import type { GroupEntry } from "@/lib/groups/dto";

/** Recording metadata remains reachable without competing with the payment summary. */
export function GroupEntryDetails({ entry, author }: { entry: GroupEntry; author: string }) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const updated =
    entry.version > 0 && entry.updatedAt && isFinite(Date.parse(entry.updatedAt))
      ? entry.updatedAt
      : null;
  return (
    <details className="group/entry-details mt-1 text-xs text-muted">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md pr-2 font-medium transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        {t("recordDetails")}
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className="transition-transform group-open/entry-details:rotate-180"
        />
      </summary>
      <div className="space-y-1 border-l border-edge pl-3 pb-1">
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
