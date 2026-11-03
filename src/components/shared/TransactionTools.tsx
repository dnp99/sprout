"use client";

import type { ReactNode } from "react";
import { ArrowLeftRight, FileUp } from "lucide-react";
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
  const open = (section: "import" | "settlements") => {
    if (groupId) router.push(`/groups/${groupId}/${section}`);
    else if (section !== "settlements") {
      if (mobile) goMobile(section);
      else set({ webView: section });
    }
  };
  const actions = [
    ...(mobile ? [{ section: "import" as const, label: nav("import"), icon: FileUp }] : []),
    ...(groupId
      ? [{ section: "settlements" as const, label: groups("settlements"), icon: ArrowLeftRight }]
      : []),
  ];
  if (!actions.length && !children) return null;
  const content = actions.length > 0 && (
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
  // Desktop imports live in the sidebar. Phone actions are direct now that
  // Bills is hidden; an extra More disclosure only conceals the remaining work.
  if (!mobile) return content;
  return (
    <div className="ledger-tools mb-2">
      {content}
      {children}
    </div>
  );
}
