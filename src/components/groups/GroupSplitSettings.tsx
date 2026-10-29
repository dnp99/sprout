"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import {
  equalWeights,
  resolveWeights,
  validWeights,
  visibleRules,
  type SplitWeights,
} from "@/lib/groups/split";
import { Field, Panel, inputClass, primaryClass, buttonClass } from "./ui";

/** The compact summary omits inherited rows; the editor still reaches every category. */
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
  const baseline =
    data.splitDefaults.method === "equal"
      ? equalWeights(data.members)
      : data.splitDefaults.participants;
  const rules = data.categorySplitRules ?? [];
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState("");
  const [draft, setDraft] = useState<SplitWeights>(baseline);
  const [draftRules, setDraftRules] = useState(rules);
  const [error, setError] = useState("");
  const active = data.members.filter((m) => m.status === "active");
  const categories = data.categories.filter((c) => !c.archived);
  const selected = resolveWeights(target || null, data.categories, draftRules, draft);
  const label = (weights: SplitWeights) =>
    active
      .map(
        (m) =>
          `${m.name} ${((weights.find((p) => p.memberId === m.id)?.weight ?? 0) / 100).toLocaleString()}%`,
      )
      .join(" / ");
  const change = (memberId: string, value: string) => {
    const weight = Math.round(Number(value) * 100);
    const next = active.map((m) => ({
      memberId: m.id,
      weight:
        m.id === memberId
          ? weight
          : active.length === 2
            ? 10000 - weight
            : (selected.find((p) => p.memberId === m.id)?.weight ?? 0),
    }));
    if (target)
      setDraftRules((r) => [
        ...r.filter((c) => c.categoryId !== target),
        { categoryId: target, participants: next },
      ]);
    else setDraft(next);
  };
  const start = () => {
    setDraft(baseline);
    setDraftRules(rules);
    setTarget("");
    setError("");
    setEditing(true);
  };
  return (
    <Panel tone="mint">
      <h2 className="font-bold">{t("splitDefaults")}</h2>
      <p className="mt-3 text-sm tabular-nums">{label(baseline)}</p>
      {visibleRules(data.categories, rules, baseline).map((c) => (
        <div key={c.id} className={`mt-3 text-sm ${c.parentId ? "pl-3" : ""}`}>
          <strong>
            {c.parentId ? `${data.categories.find((p) => p.id === c.parentId)?.name} / ` : ""}
            {c.name}
          </strong>
          <p className="mt-1 tabular-nums text-muted">
            {label(resolveWeights(c.id, data.categories, rules, baseline))}
          </p>
        </div>
      ))}
      {!data.splitDefaults.valid && (
        <p className="mt-2 text-sm text-danger">{t("defaultsInvalid")}</p>
      )}
      {data.group.role === "owner" && !data.group.archivedAt && !editing && (
        <button className={`${buttonClass} mt-4`} disabled={busy} onClick={start}>
          {t("editRatios")}
        </button>
      )}
      {editing && (
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (
                !validWeights(
                  draft,
                  active.map((m) => m.id),
                ) ||
                draftRules.some(
                  (r) =>
                    !validWeights(
                      r.participants,
                      active.map((m) => m.id),
                    ),
                )
              )
                throw new Error(t("splitHint"));
              const result = await run({
                type: "splitRules",
                participants: draft,
                categories: draftRules,
              });
              if (result) setEditing(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : t("failed"));
            }
          }}
        >
          <fieldset disabled={busy} className="space-y-3">
            <Field label={t("category")}>
              <Select
                aria-label={t("category")}
                className={inputClass}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">{t("groupRatio")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId
                      ? `${data.categories.find((p) => p.id === c.parentId)?.name} / `
                      : ""}
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            {active.map((m) => (
              <Field key={m.id} label={t("percentFor", { name: m.name })}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  inputMode="decimal"
                  className={inputClass}
                  value={(selected.find((p) => p.memberId === m.id)?.weight ?? 0) / 100}
                  onChange={(e) => change(m.id, e.target.value)}
                />
              </Field>
            ))}
            {target && (
              <button
                type="button"
                className={buttonClass}
                onClick={() => setDraftRules((r) => r.filter((c) => c.categoryId !== target))}
              >
                {t("resetRatio")}
              </button>
            )}
            <p className="text-xs text-muted">{t("ratioSaveHint")}</p>
            <div className="flex flex-wrap gap-2">
              <button className={primaryClass}>{t("saveRatios")}</button>
              <button type="button" className={buttonClass} onClick={() => setEditing(false)}>
                {t("cancel")}
              </button>
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </Panel>
  );
}
