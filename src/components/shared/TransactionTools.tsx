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
  if (!actions.length && (!mobile || !children)) return null;
  return (
    <div
      className={
        mobile
          ? "mobile-ledger-tools flex shrink-0 items-center gap-1"
          : "mb-3 flex flex-wrap gap-2"
      }
      role="group"
      aria-label={nav("transactions")}
    >
      {actions.map(({ section, label, icon: Icon }) => (
        <button
          key={section}
          type="button"
          disabled={disabled}
          aria-label={label}
          title={label}
          onClick={() => open(section)}
          className={
            mobile
              ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-edge bg-card text-ink transition-colors hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 motion-reduce:transition-none"
              : "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-edge bg-card px-3 text-[12.5px] font-semibold text-ink transition hover:bg-track disabled:opacity-50"
          }
        >
          <Icon size={16} strokeWidth={2} aria-hidden="true" />
          {!mobile && label}
        </button>
      ))}
      {mobile && children}
    </div>
  );
}
