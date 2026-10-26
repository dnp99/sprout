"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";
import { GroupApiError } from "@/state/groups";
import type { GroupOperation } from "@/lib/groups/validation";

export const inputClass =
  "min-h-11 w-full min-w-0 rounded-[10px] border border-edge bg-card px-3 py-2 text-[16px] text-ink focus:border-primary focus:outline-none";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-edge bg-card px-3 py-2 text-[13px] font-semibold text-ink transition hover:bg-track disabled:opacity-50";
export const primaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-semibold text-onprimary disabled:opacity-50";
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[12px] font-semibold text-muted">
      {label}
      {children}
    </label>
  );
}
export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-[14px] border border-edge bg-card p-4 sm:p-5">
      {children}
    </section>
  );
}
/** Trap focus and restore it to the invoking control for keyboard/screen-reader users. */
export function GroupDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null),
    closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const controls = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
        ) ?? [],
      ).filter((e) => e.getClientRects().length);
    controls()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const list = controls(),
          first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80]"
    >
      <Modal title={title} onClose={onClose} width={600}>
        {children}
      </Modal>
    </div>
  );
}
/** Feedback is shared by every group form and only succeeds after the server commits. */
export function useGroupMutation(refresh: () => Promise<void>) {
  const save = useStore((s) => s.saveGroup),
    t = useTranslations("groups"),
    { showToast } = useToast();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const lock = useRef(false),
    active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const run = async (operation: GroupOperation) => {
    if (lock.current) return null;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await save(operation);
      if (active.current) {
        await refresh();
        showToast(t("saved"));
      }
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : t("failed");
      if (active.current) {
        setError(message);
        showToast(message, "error");
      }
      if (active.current && e instanceof GroupApiError && e.status === 409) await refresh();
      throw e;
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  };
  return { run, busy, error, setError };
}
