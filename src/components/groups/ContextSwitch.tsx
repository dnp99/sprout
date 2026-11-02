"use client";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/state/store";
import {
  contextSection,
  personalContextPath,
  groupContextPath,
} from "@/lib/groups/context-navigation";
import {
  contextSwitchMotionOrigin,
  recordContextSwitch,
  type LedgerContext,
} from "@/lib/groups/context-switch-motion";
import { Check, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";

/** Routes select the financial context; motion never rewrites ledger state. */
export function ContextSwitch({
  group = false,
  disabled = false,
  beforeNavigate,
}: {
  group?: boolean;
  disabled?: boolean;
  beforeNavigate?: () => boolean | Promise<boolean>;
}) {
  const t = useTranslations("groups");
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const list = useStore((s) => s.groupList);
  const load = useStore((s) => s.loadGroupList);
  const context: LedgerContext = group ? "group" : "personal";
  const [motionOrigin] = useState(() => contextSwitchMotionOrigin(context, pathname));
  const section = contextSection(pathname, search.get("section"));
  const id = group ? pathname.split("/")[2] : list.length === 1 ? list[0].id : undefined;
  const paths = {
    personal: group ? personalContextPath(section) : pathname,
    group: group ? pathname : groupContextPath(id, section),
  };
  async function navigate(event: MouseEvent<HTMLAnchorElement>, next: LedgerContext) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    // Modified links retain normal new-tab behavior and leave this shell alone.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    if (beforeNavigate) {
      event.preventDefault();
      if (!(await beforeNavigate())) return;
    }
    recordContextSwitch(context, next, paths[next]);
    if (next === "group" && !group) void load();
    if (beforeNavigate) router.push(paths[next]);
  }
  return (
    <nav
      aria-label={t("context")}
      className="context-switch rounded-full border border-edge bg-card p-1 text-[12px] font-semibold"
    >
      <div className="context-switch-track" data-context={context} data-motion-from={motionOrigin}>
        <span className="context-switch-pill" aria-hidden="true" />
        {(["personal", "group"] as const).map((item) => {
          const active = context === item;
          const Icon = item === "personal" ? UserRound : Users;
          const label = t(item === "personal" ? "personal" : "title");
          return (
            <Link
              key={item}
              href={paths[item]}
              aria-label={label}
              title={label}
              aria-disabled={disabled}
              aria-current={active ? "page" : undefined}
              onClick={(event) => navigate(event, item)}
              className="context-switch-link"
            >
              <Icon size={15} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              {active && <span className="min-w-0 truncate">{label}</span>}
              {active && (
                <Check
                  size={13}
                  strokeWidth={2}
                  className="context-switch-check shrink-0"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
