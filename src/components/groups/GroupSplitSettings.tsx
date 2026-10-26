"use client";
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
  const t = useTranslations("groups"),
    [method, setMethod] = useState(data.splitDefaults.method),
    [weights, setWeights] = useState<Record<string, string>>(() =>
      Object.fromEntries(
        data.splitDefaults.participants.map((p) => [p.memberId, String(p.weight / 100)]),
      ),
    ),
    [error, setError] = useState("");
  return (
    <Panel>
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
            await run({ type: "defaults", method: method as "equal" | "percentage", participants });
            setError("");
          } catch (e) {
            setError(e instanceof Error ? e.message : t("failed"));
          }
        }}
      >
        <h2 className="font-bold">{t("splitDefaults")}</h2>
        <p className="text-xs text-muted">{t("defaultsHint")}</p>
        {!data.splitDefaults.valid && <p className="text-sm text-danger">{t("defaultsInvalid")}</p>}
        <fieldset
          disabled={busy || data.group.role !== "owner" || !!data.group.archivedAt}
          className="space-y-3"
        >
          <Field label={t("splitMethod")}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={inputClass}
            >
              <option value="equal">{t("equal")}</option>
              <option value="percentage">{t("percentage")}</option>
            </select>
          </Field>
          {method === "percentage" &&
            data.members
              .filter((m) => m.status === "active")
              .map((m) => (
                <Field key={m.id} label={t("percentFor", { name: m.name })}>
                  <input
                    inputMode="decimal"
                    className={inputClass}
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
    </Panel>
  );
}
