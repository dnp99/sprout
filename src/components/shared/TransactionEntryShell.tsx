"use client";
import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/overlays";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { useDesktop } from "@/hooks/useDesktop";
import { useTransactionFieldVisibility } from "@/hooks/useTransactionFieldVisibility";
const TransactionHeaderAction = createContext<HTMLElement | null>(null);

export const TransactionValidationAttempt = createContext(false);

/** Labels, field boundaries and touch targets are shared across both adapters. */
export function TransactionField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[12px] font-semibold text-muted">
      <span>
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

/** A single modal geometry and focus boundary for Personal and Group entry. */
export function TransactionDialog({
  title,
  groupName,
  onClose,
  children,
}: {
  title?: string;
  groupName?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("nav");
  const groups = useTranslations("groups");
  const Icon = groupName ? Users : UserRound;
  const [headerHost, setHeaderHost] = useState<HTMLDivElement | null>(null);
  // Modal subtitles sit outside the scrolling form, so the destination remains visible.
  const destination = (
    <span className="flex min-w-0 items-center gap-1.5">
      <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      <span className="truncate" title={groupName}>
        {groupName ?? groups("personal")}
      </span>
    </span>
  );
  return (
    <TransactionHeaderAction.Provider value={headerHost}>
      <Modal
        mobileFullScreen
        headerAction={
          <div ref={setHeaderHost} className="transaction-mobile-header-action lg:hidden" />
        }
        title={title ?? t("addTransaction")}
        subtitle={destination}
        width="var(--transaction-dialog-width, 400px)"
        className="transaction-dialog"
        onClose={onClose}
      >
        {children}
      </Modal>
    </TransactionHeaderAction.Provider>
  );
}

/** Shared submit/error placement; adapters retain their independent save logic. */
export function TransactionEntryForm({
  children,
  onSubmit,
  disabled,
  busy,
  error,
  secondaryActions,
  editing = false,
}: {
  children: ReactNode;
  onSubmit: () => void;
  disabled: boolean;
  busy: boolean;
  error?: string | null;
  secondaryActions?: ReactNode;
  editing?: boolean;
}) {
  const t = useTranslations("addFlow");
  const [attempted, setAttempted] = useState(false);
  const desktop = useDesktop();
  const formId = useId();
  const headerHost = useContext(TransactionHeaderAction);
  const scrollRef = useRef<HTMLDivElement>(null);
  useTransactionFieldVisibility(scrollRef, !desktop);
  const save = (
    <button
      type="submit"
      form={formId}
      disabled={disabled || busy}
      className="transaction-entry-save inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-control font-semibold text-onprimary disabled:opacity-50"
    >
      {busy && <LoadingIndicator size={16} />}
      {busy ? t("saving") : editing ? t("saveChanges") : t("save")}
    </button>
  );
  const actions = (
    <div className="transaction-entry-actions flex flex-wrap gap-3 border-t border-edge bg-card pt-3">
      {secondaryActions}
      {save}
    </div>
  );
  return (
    <TransactionValidationAttempt.Provider value={attempted}>
      {!desktop && headerHost && createPortal(save, headerHost)}
      <form
        id={formId}
        className="transaction-entry-form mt-4 space-y-4"
        onInvalidCapture={(event) => {
          event.preventDefault();
          setAttempted(true);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          setAttempted(true);
          if (!busy) onSubmit();
        }}
      >
        <div ref={scrollRef} className="transaction-entry-scroll no-scrollbar space-y-4">
          {children}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          {!desktop &&
            (headerHost
              ? secondaryActions && <div className="flex gap-3">{secondaryActions}</div>
              : actions)}
        </div>
        {desktop && actions}
      </form>
    </TransactionValidationAttempt.Provider>
  );
}
