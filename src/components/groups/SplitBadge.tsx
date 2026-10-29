"use client";
import { CircleCheck, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GroupEntry } from "@/lib/groups/dto";
import { savedSplit } from "@/lib/groups/split";

/** Excluded edits keep their saved calculation without a recurring warning. */
export function SplitBadge({ entry }: { entry: GroupEntry }) {
  const t = useTranslations("groups");
  const result = savedSplit(entry);
  if (!result) return null;
  const pending = result.review === "pending";
  const Icon = pending ? CircleAlert : CircleCheck;
  const label = t(pending ? "splitReviewBadge" : "splitDoneBadge");
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      className={`inline-flex shrink-0 ${pending ? "text-warning" : "text-muted"}`}
    >
      <Icon size={15} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
