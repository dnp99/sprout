"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { LedgerContextLabel } from "./LedgerContextLabel";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/overlays";
import { AccountSettings } from "@/components/settings/AccountSettings";

/** Account settings are independent of the active ledger: opening this dialog
 * must not navigate out of a group or turn account preferences into ledger data. */
export function AccountHeader({
  compact = false,
  responsiveCompact = false,
  ledgerContext = <LedgerContextLabel />,
  transactionContext,
}: {
  compact?: boolean;
  responsiveCompact?: boolean;
  ledgerContext?: ReactNode;
  /** Only Transactions replaces the greeting with a single-row page identity. */
  transactionContext?: ReactNode;
}) {
  const user = useStore((s) => s.user);
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className={`account-header ${transactionContext ? "transaction-account-header" : ""} flex min-h-11 items-center gap-3 pb-3 lg:justify-start ${compact ? (responsiveCompact ? "justify-between lg:justify-center" : "justify-center") : "justify-between"}`}
      >
        {transactionContext ? (
          <div className="transaction-page-identity">
            <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">
              {t("nav.transactions")}
            </h1>
            {transactionContext}
          </div>
        ) : (
          (!compact || responsiveCompact) && (
            <div
              className={`min-w-0 flex-1 lg:order-2 ${compact && responsiveCompact ? "lg:hidden" : ""}`}
            >
              <h1
                className={`account-greeting min-w-0 break-words lg:text-[16px] text-[20px] font-bold leading-tight text-ink`}
              >
                {t("home.greeting", { name: user.greetingName })}
              </h1>
              <div className="mt-1 min-w-0">{ledgerContext}</div>
            </div>
          )
        )}
        <button
          type="button"
          aria-label={t("titles.settings")}
          title={t("titles.settings")}
          onClick={() => setOpen(true)}
          className="account-avatar-button flex h-11 w-11 shrink-0 lg:order-1 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Avatar
            className="account-avatar"
            size={40}
            initial={(user.name || user.greetingName).trim().slice(0, 1)}
          />
        </button>
      </div>
      {open && (
        <Modal
          className="account-settings-dialog"
          title={t("titles.settings")}
          width={760}
          onClose={() => setOpen(false)}
        >
          <AccountSettings />
        </Modal>
      )}
    </>
  );
}
