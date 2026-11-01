"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import { groupCategoryLabel } from "@/lib/groups/category-tree";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { Panel, Field, inputClass, buttonClass, primaryClass } from "./ui";

/** Rules are shared group settings, so member and owner see identical controls. */
export function GroupRulesPanel({
  data,
  run,
  busy,
}: {
  data: GroupSnapshot;
  run: (op: GroupOperation) => Promise<{ id?: string; token?: string } | null>;
  busy: boolean;
}) {
  const t = useTranslations("groups");
  const [merchant, setMerchant] = useState(""),
    [categoryId, setCategoryId] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const disabled = busy || !!data.group.archivedAt;
  async function save(op: GroupOperation) {
    setError("");
    try {
      const result = await run(op);
      if (result && op.type === "merchantRule") {
        setMerchant("");
        setCategoryId("");
        setEditingId(undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    }
  }
  return (
    <Panel>
      <h2 className="font-bold">{t("merchantRules")}</h2>
      <p className="mt-2 text-sm text-muted">{t("merchantRulesHint")}</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void save({
            type: "merchantRule",
            ...(editingId ? { id: editingId } : {}),
            merchant,
            categoryId,
          });
        }}
      >
        <fieldset disabled={disabled} className="space-y-3">
          <Field label={t("merchant")}>
            <input
              required
              maxLength={120}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t("category")}>
            <Select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">{t("chooseCategory")}</option>
              {data.categories
                .filter((c) => !c.archived)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {groupCategoryLabel(data.categories, c.id)}
                  </option>
                ))}
            </Select>
          </Field>
          {editingId && (
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                setMerchant("");
                setCategoryId("");
                setEditingId(undefined);
              }}
            >
              {t("cancel")}
            </button>
          )}
          <button className={primaryClass} disabled={!merchant.trim() || !categoryId}>
            {t("save")}
          </button>
        </fieldset>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-4 divide-y divide-edge">
        {(data.merchantRules ?? []).map((rule) => (
          <div key={rule.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0 text-sm">
              <p className="break-words font-semibold">{rule.label}</p>
              <p className="text-muted">{groupCategoryLabel(data.categories, rule.categoryId)}</p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={disabled}
                type="button"
                className={buttonClass}
                onClick={() => {
                  setMerchant(rule.label);
                  setCategoryId(rule.categoryId);
                  setEditingId(rule.id);
                }}
              >
                {t("edit")}
              </button>
              <button
                disabled={disabled}
                type="button"
                className={`${buttonClass} text-danger`}
                onClick={() => void save({ type: "merchantRuleDelete", id: rule.id })}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
