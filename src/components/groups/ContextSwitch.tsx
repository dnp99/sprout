"use client";
import { Navigation, NavigationItem } from "@/components/ui/Navigation";
import { useEffect, useRef, useState, useTransition, type MouseEvent } from "react";
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
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    if (!pending && !checking) inFlight.current = false;
  }, [pending, checking]);
  const context: LedgerContext = group ? "group" : "personal";
  const [motionOrigin] = useState(() => contextSwitchMotionOrigin(context, pathname));
  const section = contextSection(pathname, search.get("section"));
  const id = group ? pathname.split("/")[2] : list.length === 1 ? list[0].id : undefined;
  const paths = {
    personal: group ? personalContextPath(section) : pathname,
    group: group ? pathname : groupContextPath(id, section),
  };
  async function navigate(event: MouseEvent<HTMLAnchorElement>, next: LedgerContext) {
    if (disabled || pending || inFlight.current) {
      event.preventDefault();
      return;
    }
    // Modified links remain native. No guard, state write or motion is dispatched.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    if (next === context) return;
    // Lock before awaiting a discard guard: rapid clicks must not open duplicate
    // confirmations or dispatch the same navigation twice.
    inFlight.current = true;
    let accepted = false;
    try {
      if (beforeNavigate) {
        setChecking(true);
        if (!(await beforeNavigate())) return;
      }
      accepted = true;
      recordContextSwitch(context, next, paths[next]);
      startTransition(() => router.push(paths[next]));
    } finally {
      setChecking(false);
      if (!accepted) inFlight.current = false;
    }
  }

  return (
    <Navigation
      aria-label={t("context")}
      aria-busy={pending || checking}
      className="context-switch bg-card"
      layout="context"
      shape="pill"
      size="compact"
      indicatorIndex={group ? 1 : 0}
      motionFrom={motionOrigin === undefined ? undefined : motionOrigin === "group" ? 1 : 0}
    >
      {(["personal", "group"] as const).map((item) => {
        const active = context === item;
        const Icon = item === "personal" ? UserRound : Users;
        const label = t(item === "personal" ? "personal" : "title");
        return (
          <NavigationItem
            key={item}
            href={paths[item]}
            prefetch
            active={active}
            label={label}
            title={label}
            variant="context"
            collapsed={!active}
            aria-disabled={disabled || pending || checking}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => navigate(event, item)}
            icon={<Icon size={15} strokeWidth={2} />}
            trailing={active ? <Check size={13} strokeWidth={2} aria-hidden="true" /> : undefined}
          />
        );
      })}
    </Navigation>
  );
}
