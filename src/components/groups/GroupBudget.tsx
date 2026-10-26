"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatBudgetInput, formatMoney, parseMoneyInput } from "@/lib/format";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { groupFetch } from "@/state/groups";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { Field, Panel, inputClass, buttonClass, primaryClass } from "./ui";

/** Month-specific drafts keep a new household plan from rewriting earlier budgets. */
export function GroupBudget({
  data,
  month,
  run,
  busy,
}: {
  data: GroupSnapshot;
  month: string;
  run: (op: GroupOperation) => Promise<unknown>;
  busy: boolean;
}) {
  const t = useTranslations("groups"),
    locale = useStore((s) => s.locale),
    [pool, setPool] = useState(formatBudgetInput(data.budget.poolCents, locale)),
    [allocations, setAllocations] = useState<Record<string, string>>(() =>
      Object.fromEntries(
        Object.entries(data.budget.allocations).map(([id, n]) => [
          id,
          formatBudgetInput(n, locale),
        ]),
      ),
    ),
    [error, setError] = useState("");
  const editable = data.group.role === "owner" && !data.group.archivedAt;
  const save = async () => {
    try {
      const poolCents = pool.trim() ? parseMoneyInput(pool, locale) : 0;
      const values = Object.fromEntries(
        Object.entries(allocations).map(([id, value]) => [
          id,
          value.trim() ? parseMoneyInput(value, locale) : 0,
        ]),
      );
      if (poolCents === null || Object.values(values).some((v) => v === null || v < 0))
        throw new Error(t("validAmount"));
      await run({
        type: "budget",
        month,
        poolCents,
        allocations: values as Record<string, number>,
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    }
  };
  const copy = async () => {
    try {
      const [year, m] = month.split("-").map(Number);
      const d = new Date(Date.UTC(year, m - 2, 1));
      const previous = d.toISOString().slice(0, 7);
      const source = await groupFetch<GroupSnapshot>(
        `/api/groups/${data.group.id}?month=${previous}`,
      );
      setPool(formatBudgetInput(source.budget.poolCents, locale));
      setAllocations(
        Object.fromEntries(
          Object.entries(source.budget.allocations).map(([id, n]) => [
            id,
            formatBudgetInput(n, locale),
          ]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    }
  };
  return (
    <Panel>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">
            {t("budget")} · {month}
          </h2>
          {editable && (
            <button type="button" onClick={() => void copy()} className={buttonClass}>
              {t("copyPrevious")}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{t("budgetHint")}</p>
        <fieldset disabled={!editable || busy} className="space-y-4">
          <Field label={t("monthlyPool")}>
            <input
              inputMode="decimal"
              value={pool}
              onChange={(e) => setPool(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="divide-y divide-edge">
            {data.categories
              .filter((c) => !c.archived || data.budget.allocations[c.id])
              .map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <EntitySymbol emoji={c.emoji} color={c.color} />
                  <div className="min-w-0 flex-1 text-sm">
                    <strong>{c.name}</strong>
                    <p className="text-xs text-muted">
                      {formatMoney(data.summary.categorySpending[c.id] ?? 0, { locale })}{" "}
                      {t("spent")}
                    </p>
                  </div>
                  <label className="w-28">
                    <span className="sr-only">{t("allocationFor", { name: c.name })}</span>
                    <input
                      inputMode="decimal"
                      className={inputClass}
                      value={allocations[c.id] ?? ""}
                      onChange={(e) => setAllocations((p) => ({ ...p, [c.id]: e.target.value }))}
                    />
                  </label>
                </div>
              ))}
          </div>
          {editable && <button className={primaryClass}>{t("save")}</button>}
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
