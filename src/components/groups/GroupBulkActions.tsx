"use client";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { IconAction } from "@/components/ui/IconAction";
import { requiresDeleteConfirmation } from "@/lib/deletion";

import { orderGroupCategories, groupCategoryLabel } from "@/lib/groups/category-tree";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import { useStore } from "@/state/store";
import { groupFetch } from "@/state/groups";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { BulkAction, GroupSelection } from "@/lib/groups/bulk-validation";
import { GroupDialog, Field, buttonClass, inputClass, primaryClass } from "./ui";
import { useGroupBulk } from "./useGroupBulk";

type Editor = "date" | "category" | "copy" | "delete";
/** A wrapping action bar and focused dialog keep large selections usable on phones. */
export function GroupBulkActions({
  data,
  selection,
  refresh,
  onBusyChange,
  onClear,
}: {
  data: GroupSnapshot;
  selection: GroupSelection;
  refresh: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onClear: () => void;
}) {
  const txns = useTranslations("txns");
  const t = useTranslations("groups"),
    list = useStore((s) => s.groupList);
  const { run, busy, error } = useGroupBulk(data, refresh, onBusyChange);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [date, setDate] = useState(""),
    [categoryId, setCategoryId] = useState("choose"),
    [reason, setReason] = useState("");
  const [targetId, setTargetId] = useState(""),
    [target, setTarget] = useState<GroupSnapshot | null>(null),
    [payerId, setPayerId] = useState("");
  const [targetLoading, setTargetLoading] = useState(false),
    [targetError, setTargetError] = useState("");
  const generation = useRef(0);
  const archived = !!data.group.archivedAt;
  const inlineReason = !requiresDeleteConfirmation(selection.length);
  async function loadTarget(id: string) {
    const seq = ++generation.current;
    setTargetId(id);
    setTarget(null);
    setTargetError("");
    setTargetLoading(!!id);
    if (!id) return;
    try {
      const snapshot = await groupFetch<GroupSnapshot>(`/api/groups/${id}?month=2000-01`);
      if (generation.current !== seq) return;
      setTarget(snapshot);
      setPayerId(snapshot.group.memberId);
    } catch (error) {
      if (generation.current === seq)
        setTargetError(error instanceof Error ? error.message : t("failed"));
    } finally {
      if (generation.current === seq) setTargetLoading(false);
    }
  }
  async function apply(action: BulkAction) {
    if (await run(action, selection)) {
      setEditor(null);
      if (action.action !== "export") onClear();
    }
  }
  return (
    <>
      <div className="sticky top-0 z-10 space-y-3 rounded-[14px] border border-edge bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-sm font-semibold">
            {txns("transactionsSelected", { count: selection.length })}
          </p>
          <button type="button" disabled={busy} className={buttonClass} onClick={onClear}>
            {txns("clearSelection")}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            className={buttonClass}
            onClick={() => void apply({ action: "export" })}
          >
            {t("bulkExport")}
          </button>
          {!archived && (
            <>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() => setEditor("copy")}
              >
                {t("bulkCopy")}
              </button>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() => setEditor("date")}
              >
                {t("bulkDate")}
              </button>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() => setEditor("category")}
              >
                {txns("setCategory")}
              </button>
              <IconAction
                action="delete"
                className="rounded-[10px] border border-edge bg-card text-danger hover:bg-track"
                label={txns("delete")}
                type="button"
                disabled={busy || (inlineReason && !reason.trim())}
                onClick={() => {
                  if (requiresDeleteConfirmation(selection.length)) setEditor("delete");
                  else void apply({ action: "delete", reason: reason || txns("delete") });
                }}
              />
            </>
          )}
        </div>
        {inlineReason && !archived && (
          <Field label={t("voidReason")}>
            <input
              value={reason}
              maxLength={300}
              disabled={busy}
              className={inputClass}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      {editor && (
        <GroupDialog
          title={t(
            `bulk${editor === "date" ? "Date" : editor === "category" ? "Category" : editor === "copy" ? "Copy" : "Delete"}`,
          )}
          onClose={() => {
            if (!busy) setEditor(null);
          }}
        >
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (editor === "date") void apply({ action: "date", occurredOn: date });
              else if (editor === "category" && categoryId !== "choose")
                void apply({ action: "category", categoryId: categoryId || null });
              else if (editor === "delete") void apply({ action: "delete", reason });
              else if (editor === "copy" && target)
                void apply({
                  action: "copy",
                  targetId: target.group.id,
                  targetRevision: target.group.revision,
                  payerId: payerId || null,
                  settlement: !!payerId,
                });
            }}
          >
            <p className="text-sm text-muted">
              {txns("transactionsSelected", { count: selection.length })}
            </p>
            <fieldset disabled={busy} className="space-y-4">
              {editor === "date" && (
                <Field label={t("date")}>
                  <input
                    aria-label={t("date")}
                    type="date"
                    required
                    className={inputClass}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Field>
              )}
              {editor === "category" && (
                <Field label={t("category")}>
                  <Select
                    aria-label={t("category")}
                    className={inputClass}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="choose" disabled>
                      {t("bulkChooseCategory")}
                    </option>
                    <option value="">{t("uncategorized")}</option>
                    {orderGroupCategories(data.categories)
                      .filter((c) => !c.archived)
                      .map((c) => (
                        <option key={c.id} value={c.id} data-icon={c.emoji}>
                          {groupCategoryLabel(data.categories, c.id)}
                        </option>
                      ))}
                  </Select>
                </Field>
              )}
              {editor === "delete" && (
                <>
                  <p className="text-sm text-danger">{t("bulkDeleteHint")}</p>
                  <Field label={t("voidReason")}>
                    <input
                      required
                      maxLength={300}
                      className={inputClass}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </Field>
                </>
              )}
              {editor === "copy" && (
                <>
                  <p className="text-sm text-muted">{t("bulkCopyHint")}</p>
                  <Field label={t("bulkTarget")}>
                    <Select
                      aria-label={t("bulkTarget")}
                      className={inputClass}
                      value={targetId}
                      onChange={(e) => void loadTarget(e.target.value)}
                    >
                      <option value="">{t("bulkChooseGroup")}</option>
                      {list
                        .filter((g) => g.id !== data.group.id && !g.archivedAt)
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                    </Select>
                  </Field>
                  {targetLoading && (
                    <p role="status" className="flex items-center gap-2 text-sm text-muted">
                      <LoadingIndicator size={16} />
                      {t("loading")}
                    </p>
                  )}
                  {targetError && (
                    <p role="alert" className="text-sm text-danger">
                      {targetError}
                    </p>
                  )}
                  {target && (
                    <>
                      <Field label={t("bulkPayer")}>
                        <Select
                          aria-label={t("bulkPayer")}
                          value={payerId}
                          className={inputClass}
                          onChange={(e) => setPayerId(e.target.value)}
                        >
                          {target.members
                            .filter((m) => m.status === "active")
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          <option value="">{t("sharedFunds")}</option>
                        </Select>
                      </Field>
                    </>
                  )}
                </>
              )}
              {(editor === "date" || editor === "category") && (
                <p className="text-xs text-muted">{t("bulkEditHint")}</p>
              )}
              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={
                    editor === "copy"
                      ? !target || targetLoading || !!target.group.archivedAt
                      : editor === "category"
                        ? categoryId === "choose"
                        : false
                  }
                  className={
                    editor === "delete" ? `${buttonClass} border-danger text-danger` : primaryClass
                  }
                >
                  {t(
                    editor === "copy"
                      ? "bulkConfirmCopy"
                      : editor === "delete"
                        ? "bulkConfirmDelete"
                        : "bulkApply",
                  )}
                </button>
                <button type="button" className={buttonClass} onClick={() => setEditor(null)}>
                  {t("cancel")}
                </button>
              </div>
            </fieldset>
          </form>
        </GroupDialog>
      )}
    </>
  );
}
