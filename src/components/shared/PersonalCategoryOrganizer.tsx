"use client";
import { useState } from "react";
import { CategoryOrganizer } from "./CategoryOrganizer";
import { useStore } from "@/state/store";
import { categoryRevision } from "@/lib/categories/tree-policy";
import { useToast } from "@/components/ui/Toast";
import { useTranslations } from "next-intl";

export function PersonalCategoryOrganizer({ onDone }: { onDone: () => void }) {
  const categories = useStore((s) => s.categories),
    transactions = useStore((s) => s.transactions),
    refresh = useStore((s) => s.refresh),
    loading = useStore((s) => s.transactionsLoading);
  const [busy, setBusy] = useState(false),
    t = useTranslations("groups"),
    { showToast } = useToast();
  const recordCounts: Record<string, number> = {};
  for (const row of transactions)
    if (row.categoryId) recordCounts[row.categoryId] = (recordCounts[row.categoryId] ?? 0) + 1;
  return (
    <CategoryOrganizer
      data={{
        categories: categories.map((c) => ({ ...c, archived: false })),
        group: { revision: categoryRevision(categories) },
        recordCounts,
      }}
      busy={busy || loading}
      onDone={onDone}
      run={async (op) => {
        setBusy(true);
        try {
          const response = await fetch("/api/categories/organize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(op),
          });
          const result = await response.json();
          if (!response.ok) {
            if (response.status === 409) await refresh();
            throw new Error(result.error ?? t("failed"));
          }
          await refresh();
          showToast(t("saved"));
          return result;
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}
