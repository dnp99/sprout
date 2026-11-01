"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

/** The floating action remains reachable even at the top. It opens
 * the existing ledger composer and retains the palette's calendar button shape. */
export function ScrollRecordAction({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations("nav");
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-app justify-end px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0 lg:max-w-none">
        <button
          type="button"
          aria-label={t("addRecord")}
          title={t("addRecord")}
          onClick={onClick}
          disabled={disabled}
          className="calendar-add record-floating-action pointer-events-auto shadow-lg disabled:opacity-40"
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>
    </>
  );
}
