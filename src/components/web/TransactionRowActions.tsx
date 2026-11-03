"use client";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";

import { CircleMinus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Popover } from "@/components/ui/Popover";
import { useToast } from "@/components/ui/Toast";

interface Props {
  excluded: boolean;
  onEdit: () => void;
  onExclude: () => Promise<void>;
  onDelete: () => Promise<void>;
}

/** Per-row actions keep destructive controls discoverable without making every
 * transaction row visually noisy. Small deletions apply directly. */
export function TransactionRowActions({ excluded, onEdit, onExclude, onDelete }: Props) {
  const t = useTranslations("txns");
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"exclude" | "delete" | null>(null);

  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const close = () => setOpen(false);

  // The ledger scrolls independently; fixed positioning avoids clipping by its
  // viewport. Dismiss on scroll/resize rather than leave a detached row menu.
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: Event) => {
      if (!(event.target instanceof Node) || !menu.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

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
    } catch {
      showToast(t("transactionDeleteFailed"), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Popover open={open} onClose={close} className="relative flex h-full items-center justify-end">
      <button
        ref={trigger}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          const box = event.currentTarget.getBoundingClientRect();
          const width = Math.min(224, window.innerWidth - 16);
          const height = Math.min(156, window.innerHeight - 16);
          setPosition({
            left: Math.max(8, Math.min(box.right - width, window.innerWidth - width - 8)),
            top: Math.max(
              8,
              box.bottom + height + 4 <= window.innerHeight - 8
                ? box.bottom + 4
                : box.top - height - 4,
            ),
          });
          setOpen((value) => !value);
        }}
        aria-label={t("rowActions")}
        title={t("rowActions")}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-[8px] text-muted transition hover:bg-track hover:text-ink"
      >
        <MoreHorizontal size={17} strokeWidth={2} />
      </button>
      {open && (
        <div
          ref={menu}
          style={position}
          className="fixed z-[70] w-56 max-w-[calc(100vw-16px)] max-h-[calc(100dvh-16px)] overflow-y-auto rounded-[12px] border border-edge bg-card p-1.5 shadow-lg"
        >
          <button
            type="button"
            disabled={busy !== null}
            className="flex min-h-11 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12.5px] font-medium text-ink hover:bg-track disabled:opacity-45"
            onClick={() => {
              close();
              onEdit();
            }}
          >
            <Pencil size={14} aria-hidden="true" />
            {t("edit")}
          </button>
          <button
            type="button"
            disabled={excluded || busy !== null}
            onClick={() => void exclude()}
            className="flex min-h-11 w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium text-ink hover:bg-track disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy === "exclude" ? <LoadingIndicator size={14} /> : <CircleMinus size={14} />}
            {t("excludeFromBudget")}
          </button>
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12.5px] font-medium text-danger hover:bg-primary-soft disabled:opacity-45"
            disabled={busy !== null}
            onClick={() => {
              close();
              void remove();
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            {t("delete")}
          </button>
        </div>
      )}
    </Popover>
  );
}
