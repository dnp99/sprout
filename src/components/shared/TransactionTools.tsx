"use client";

import type { ReactNode } from "react";
import { ArrowLeftRight, FileUp, NotebookText, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useStore } from "@/state/store";

/** Both ledgers keep related workspaces beside transaction browsing. Group
 * navigation uses explicit routes so these actions never touch Personal data. */
export function TransactionTools({
  mobile = false,
  groupId,
  disabled = false,
  children,
}: {
  mobile?: boolean;
  groupId?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const nav = useTranslations("nav");
  const groups = useTranslations("groups");
  const router = useRouter();
  const set = useStore((s) => s.set);
  const goMobile = useStore((s) => s.goMobile);
  const open = (section: "bills" | "import" | "settlements") => {
    if (groupId) router.push(`/groups/${groupId}/${section}`);
    else if (section !== "settlements") {
      if (mobile) goMobile(section);
      else set({ webView: section });
    }
  };
  const actions = [
    { section: "bills" as const, label: nav("bills"), icon: NotebookText },
    { section: "import" as const, label: nav("import"), icon: FileUp },
    ...(groupId
      ? [{ section: "settlements" as const, label: groups("settlements"), icon: ArrowLeftRight }]
      : []),
  ];
  const content = (
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={nav("transactions")}>
      {actions.map(({ section, label, icon: Icon }) => (
        <button
          key={section}
          type="button"
          disabled={disabled}
          onClick={() => open(section)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-edge bg-card px-3 text-[12.5px] font-semibold text-ink transition hover:bg-track disabled:opacity-50"
        >
          <Icon size={16} strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  );
  // Secondary workspaces should remain reachable without pushing the ledger
  // below the fold. Desktop keeps its existing always-visible toolbar.
  if (!mobile) return content;
  return (
    <details className="ledger-tools mb-2">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[10px] border border-edge bg-card px-3 text-[13px] font-semibold text-ink">
        {nav("more")} <ChevronDown size={16} />
      </summary>
      <div className="pt-2">
        {content}
        {children}
      </div>
    </details>
  );
}
