"use client";

import { CircleMinus, LoaderCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Popover } from "@/components/ui/Popover";
import { useToast } from "@/components/ui/Toast";

interface Props {
  excluded: boolean;
  onEdit: () => void;
  onExclude: () => Promise<void>;
  onDelete: () => Promise<void>;
}

/** Per-row actions keep destructive controls discoverable without making every
 * transaction row visually noisy. Exclusion is reversible from the edit form;
 * deletion retains a confirmation because it permanently removes the row. */
export function TransactionRowActions({ excluded, onEdit, onExclude, onDelete }: Props) {
  const t = useTranslations("txns");
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<"exclude" | "delete" | null>(null);

  const close = () => setOpen(false);

  async function exclude() {
    setBusy("exclude");
    try {
      await onExclude();
      showToast(t("bulkExcluded", { count: 1 }));
      close();
    } catch {
      showToast(t("transactionUpdateFailed"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    try {
      await onDelete();
      showToast(t("bulkDeleted", { count: 1 }));
      setConfirmDelete(false);
    } catch {
      showToast(t("transactionDeleteFailed"), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Popover open={open} onClose={close} className="relative flex h-full items-center justify-end">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label={t("rowActions")}
        title={t("rowActions")}
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition hover:bg-track hover:text-ink"
      >
        <MoreHorizontal size={17} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-40 w-48 rounded-[12px] border border-edge bg-card p-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => {
              close();
              onEdit();
            }}
            className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium text-ink hover:bg-track"
          >
            <Pencil size={14} />
            {t("edit")}
          </button>
          <button
            type="button"
            disabled={excluded || busy !== null}
            onClick={() => void exclude()}
            className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium text-ink hover:bg-track disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy === "exclude" ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <CircleMinus size={14} />
            )}
            {t("excludeFromBudget")}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => {
              close();
              setConfirmDelete(true);
            }}
            className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 size={14} />
            {t("delete")}
          </button>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={t("deleteN", { count: 1 })}
          message={t("bulkDeleteConfirm")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          busy={busy === "delete"}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void remove()}
        />
      )}
    </Popover>
  );
}
