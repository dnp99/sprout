"use client";
import { groupCategoryLabel } from "@/lib/groups/category-tree";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Import } from "@/components/web/views/Import";
import { Select } from "@/components/ui/Select";
import type { GroupSnapshot } from "@/lib/groups/dto";
import { Field, Panel, buttonClass, inputClass } from "./ui";

/** Reuse the personal review workspace with an explicit group-only destination.
 * The selected payer applies to this file; author remains the signed-in member. */
export function GroupImport({
  data,
  refresh,
  onViewTransactions,
  onBusyChange,
}: {
  data: GroupSnapshot;
  refresh: () => Promise<void>;
  onViewTransactions: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const t = useTranslations("groups");
  const [payer, setPayer] = useState(data.group.memberId);
  const categoryNames = useMemo(
    () =>
      data.categories
        .filter((c) => !c.archived)
        .map((c) => groupCategoryLabel(data.categories, c.id)),
    [data.categories],
  );
  const disabled = Boolean(data.group.archivedAt);
  const payerName =
    payer === "shared" ? t("sharedFunds") : (data.members.find((m) => m.id === payer)?.name ?? "");
  const detail = (
    <p className="mt-3 rounded-[10px] border border-edge bg-primary-soft p-3 text-sm text-ink">
      {t("importDestination", { name: data.group.name, payer: payerName })}{" "}
      {t("splitCalculateHint")}
    </p>
  );
  return (
    <Import
      target={{
        group: true,
        aiDescription: t("groupImportAi"),
        endpoint: `/api/groups/${data.group.id}/import`,
        categoryNames,
        disabled,
        extraBody: {
          payerId: payer === "shared" ? null : payer,
          settlement: payer !== "shared",
          revision: data.group.revision,
        },
        onSuccess: refresh,
        onConflict: refresh,
      }}
      onBusyChange={onBusyChange}
      onViewTransactions={onViewTransactions}
      confirmation={detail}
      controls={
        <Panel className="mt-4 space-y-3" tone="butter">
          <h2 className="font-bold">{t("groupImportTitle")}</h2>
          <p className="text-sm text-muted">{t("groupImportHint")}</p>
          {data.group.archivedAt && (
            <p role="alert" className="text-sm text-danger">
              {t("archivedNotice")}
            </p>
          )}
          {(!data.splitDefaults.valid || data.categorySplits?.some((s) => !s.valid)) && (
            <p role="alert" className="text-sm text-danger">
              {t("importDefaultsInvalid")}
            </p>
          )}
          <Field label={t("importPayer")}>
            <Select
              value={payer}
              className={inputClass}
              disabled={disabled}
              onChange={(event) => setPayer(event.target.value)}
            >
              {data.members
                .filter((m) => m.status === "active")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              <option value="shared">{t("sharedFunds")}</option>
            </Select>
          </Field>

          {detail}
        </Panel>
      }
      exportSource={{
        transactions: (data.reportEntries ?? []).map((entry) => ({
          occurredAt: `${entry.occurredOn}T12:00:00`,
        })),
        endpoint: `/api/groups/${data.group.id}/export?format=transactions`,
        filename: "sprout-group-transactions",
        description: t("groupExportHint"),
        footer: (
          <a className={buttonClass} href={`/api/groups/${data.group.id}/export`}>
            {t("groupAuditExport")}
          </a>
        ),
      }}
    />
  );
}
