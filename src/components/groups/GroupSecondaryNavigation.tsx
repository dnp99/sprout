"use client";

import { useTranslations } from "next-intl";
import { ArrowLeftRight } from "lucide-react";
import { buttonClass } from "./ui";
import { sidebarItemClass } from "@/components/shared/sidebar-style";

/** Group administration and destinations outside the five common mobile tabs
 * stay reachable without shifting shared navigation or header actions. */
export function GroupSecondaryNavigation({
  id,
  tab,
  busy,
  navigate,
  collapsed,
}: {
  id?: string;
  tab: string;
  busy: boolean;
  navigate: (path: string) => void;
  collapsed: boolean;
}) {
  const t = useTranslations("groups");
  const nav = useTranslations("nav");
  const actions = (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => navigate(`/groups?manage=1&section=${encodeURIComponent(tab)}`)}
        className="inline-flex min-h-11 items-center gap-2 px-1 text-[12.5px] font-medium text-muted"
      >
        <ArrowLeftRight size={15} strokeWidth={2} />
        {t("manageGroups")}
      </button>
      {id &&
        ["bills", "settlements", "import"].map((section) => (
          <button
            key={section}
            type="button"
            disabled={busy}
            aria-current={tab === section ? "page" : undefined}
            onClick={() => navigate(`/groups/${id}/${section}`)}
            className="inline-flex min-h-11 items-center gap-2 px-1 text-[12.5px] font-medium text-muted"
          >
            {section === "settlements" ? t(section) : nav(section)}
          </button>
        ))}
    </>
  );
  return (
    <>
      <details className="px-4 py-2 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center text-[12.5px] font-semibold text-muted">
          {nav("more")}
        </summary>
        <div className="flex flex-wrap gap-2 pb-2">{actions}</div>
      </details>
      <div className="mt-4 hidden space-y-2 lg:block">
        <button
          type="button"
          disabled={busy}
          onClick={() => navigate(`/groups?manage=1&section=${encodeURIComponent(tab)}`)}
          aria-label={t("manageGroups")}
          className={`${buttonClass} w-full`}
        >
          <ArrowLeftRight size={15} strokeWidth={2} />
          <span className={collapsed ? "hidden" : ""}>{t("manageGroups")}</span>
        </button>
        {id && (
          <button
            type="button"
            disabled={busy}
            onClick={() => navigate(`/groups/${id}/settlements`)}
            aria-label={t("settlements")}
            className={sidebarItemClass(tab === "settlements", collapsed)}
          >
            <ArrowLeftRight size={15} strokeWidth={2} />
            <span className={collapsed ? "hidden" : ""}>{t("settlements")}</span>
          </button>
        )}
      </div>
    </>
  );
}
