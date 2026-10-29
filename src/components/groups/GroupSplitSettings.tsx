"use client";

import { orderGroupCategories, groupCategoryLabel } from "@/lib/groups/category-tree";

import { resolveGroupSplit } from "@/lib/groups/splits";
import { PercentageInput } from "./PercentageInput";
import { Select } from "@/components/ui/Select";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { Field, Panel, inputClass, primaryClass } from "./ui";

/** Default changes affect future drafts only, never saved expense allocations. */
export function GroupSplitSettings({
  data,
  run,
  busy,
}: {
  data: GroupSnapshot;
  run: (op: GroupOperation) => Promise<unknown>;
  busy: boolean;
}) {
  const t = useTranslations("groups");
  const [categoryId, setCategoryId] = useState("");
  return (
    <Panel>
      <h2 className="font-bold">{t("splitDefaults")}</h2>
      <p className="mt-2 text-xs text-muted">{t("categorySplitHint")}</p>
      <div className="mt-4 space-y-4">
        <Field label={t("splitScope")}>
          <Select
            aria-label={t("splitScope")}
            value={categoryId}
            disabled={busy}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("groupDefault")}</option>
            {orderGroupCategories(data.categories)
              .filter((c) => !c.archived)
              .map((c) => (
                <option key={c.id} data-icon={c.emoji} value={c.id}>
                  {groupCategoryLabel(data.categories, c.id)}
                </option>
              ))}
          </Select>
        </Field>
        <SplitEditor
          key={`${categoryId}:${data.group.revision}`}
          data={data}
          categoryId={categoryId}
          run={run}
          busy={busy}
        />
      </div>
    </Panel>
  );
}

function SplitEditor({
  data,
  categoryId,
  run,
  busy,
}: {
  data: GroupSnapshot;
  categoryId: string;
  run: (op: GroupOperation) => Promise<unknown>;
  busy: boolean;
}) {
  const saved = categoryId
    ? data.categorySplits?.find((s) => s.categoryId === categoryId)
    : data.splitDefaults;
  const t = useTranslations("groups"),
    [method, setMethod] = useState(saved?.method ?? "inherit"),
    [weights, setWeights] = useState<Record<string, string>>(() =>
      Object.fromEntries(
        (saved ?? resolveGroupSplit(data, categoryId || null)).participants.map((p) => [
          p.memberId,
          (saved ?? resolveGroupSplit(data, categoryId || null)).method === "percentage"
            ? String(p.weight / 100)
            : "",
        ]),
      ),
    ),
    [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const participants = data.members
            .filter((m) => m.status === "active")
            .map((m) => ({
              memberId: m.id,
              weight: Math.round(Number(weights[m.id] ?? 0) * 100),
            }));
          await run({
            type: "defaults",
            method: method as "equal" | "percentage" | "inherit",
            categoryId: categoryId || null,
            participants: method === "percentage" ? participants : [],
          });
          setError("");
        } catch (e) {
          setError(e instanceof Error ? e.message : t("failed"));
        }
      }}
    >
      <p className="text-xs text-muted">{t("defaultsHint")}</p>
      {saved && !saved.valid && <p className="text-sm text-danger">{t("defaultsInvalid")}</p>}
      <fieldset
        disabled={busy || data.group.role !== "owner" || !!data.group.archivedAt}
        className="space-y-3"
      >
        <Field label={t("splitMethod")}>
          <Select
            aria-label={t("splitMethod")}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={inputClass}
          >
            {categoryId && <option value="inherit">{t("useGroupDefault")}</option>}
            <option value="equal">{t("equal")}</option>
            <option value="percentage">{t("percentage")}</option>
          </Select>
        </Field>
        {method === "percentage" &&
          data.members
            .filter((m) => m.status === "active")
            .map((m) => (
              <Field key={m.id} label={t("percentFor", { name: m.name })}>
                <PercentageInput
                  aria-label={t("percentFor", { name: m.name })}
                  value={weights[m.id] ?? ""}
                  onChange={(e) => setWeights((w) => ({ ...w, [m.id]: e.target.value }))}
                />
              </Field>
            ))}
        {data.group.role === "owner" && <button className={primaryClass}>{t("save")}</button>}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
