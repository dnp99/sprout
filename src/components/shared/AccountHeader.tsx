"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/overlays";
import { AccountSettings } from "@/components/settings/AccountSettings";

/** Account settings are independent of the active ledger: opening this dialog
 * must not navigate out of a group or turn account preferences into ledger data. */
export function AccountHeader({
  compact = false,
  responsiveCompact = false,
}: {
  compact?: boolean;
  responsiveCompact?: boolean;
}) {
  const user = useStore((s) => s.user);
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className={`account-header flex min-h-11 items-center gap-3 pb-3 ${compact ? (responsiveCompact ? "justify-between lg:justify-center" : "justify-center") : "justify-between"}`}
      >
        {(!compact || responsiveCompact) && (
          <h1
            className={`${compact && responsiveCompact ? "lg:hidden" : ""} account-greeting min-w-0 break-words text-[20px] font-bold leading-tight text-ink`}
          >
            {t("home.greeting", { name: user.greetingName })}
          </h1>
        )}
        <button
          type="button"
          aria-label={t("titles.settings")}
          title={t("titles.settings")}
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Avatar
            className="account-avatar"
            size={40}
            initial={(user.name || user.greetingName).trim().slice(0, 1)}
          />
        </button>
      </div>
      {open && (
        <Modal title={t("titles.settings")} width={760} onClose={() => setOpen(false)}>
          <AccountSettings />
        </Modal>
      )}
    </>
  );
}
