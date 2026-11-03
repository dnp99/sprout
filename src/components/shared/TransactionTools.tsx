"use client";

import { useState, type ReactNode } from "react";
import { Popover } from "@/components/ui/Popover";
import { ArrowLeftRight, ChevronDown, FileUp, MoreHorizontal } from "lucide-react";
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
  const t = useTranslations("txns");
  const [expanded, setExpanded] = useState(false);
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
  if (!mobile) return content;
  return (
    <Popover
      open={expanded}
      onClose={() => setExpanded(false)}
      className="mobile-ledger-more relative shrink-0"
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={t("more")}
        title={t("more")}
        aria-haspopup="true"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="flex h-11 min-w-11 items-center justify-center gap-0.5 rounded-[10px] border border-edge bg-card px-1 text-ink disabled:opacity-50"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
        <ChevronDown size={11} aria-hidden="true" className={expanded ? "rotate-180" : ""} />
      </button>
      {expanded && (
        <div className="absolute right-0 top-full z-40 mt-1 w-52 rounded-[12px] border border-edge bg-card p-1.5 shadow-lg">
          {actions.map(({ section, label, icon: Icon }) => (
            <button
              key={section}
              type="button"
              disabled={disabled}
              onClick={() => {
                setExpanded(false);
                open(section);
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-[8px] px-3 text-left text-xs font-semibold text-ink hover:bg-track"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
          {children}
        </div>
      )}
    </Popover>
  );
}
