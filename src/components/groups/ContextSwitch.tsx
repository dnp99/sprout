"use client";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/state/store";
import {
  contextSection,
  personalContextPath,
  groupContextPath,
} from "@/lib/groups/context-navigation";
import { UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";

/** Routes select the financial context; this never rewrites personal store data. */
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
  const section = contextSection(pathname, search.get("section"));
  const id = group ? pathname.split("/")[2] : list.length === 1 ? list[0].id : undefined;
  return (
    <nav
      aria-label={t("context")}
      className="flex gap-1 rounded-full border border-edge bg-card p-1 text-[12px] font-semibold"
    >
      <Link
        href={group ? personalContextPath(section) : pathname}
        aria-disabled={disabled}
        onClick={async (e) => {
          if (disabled || beforeNavigate) e.preventDefault();
          if (!disabled && beforeNavigate && (await beforeNavigate()))
            router.push(group ? personalContextPath(section) : pathname);
        }}
        aria-current={!group ? "page" : undefined}
        className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-2 ${!group ? "bg-primary-soft text-primary" : "text-muted"}`}
      >
        <UserRound size={15} strokeWidth={2} aria-hidden="true" />
        {t("personal")}
      </Link>
      <Link
        href={group ? pathname : groupContextPath(id, section)}
        aria-disabled={disabled}
        onClick={async (e) => {
          if (disabled || beforeNavigate) e.preventDefault();
          if (disabled || (beforeNavigate && !(await beforeNavigate()))) return;
          if (!group) void load();
          if (beforeNavigate) router.push(group ? pathname : groupContextPath(id, section));
        }}
        aria-current={group ? "page" : undefined}
        className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-2 ${group ? "bg-primary-soft text-primary" : "text-muted"}`}
      >
        <Users size={15} />
        {t("title")}
      </Link>
    </nav>
  );
}
