"use client";
import Link from "next/link";
import { LockKeyhole, Users } from "lucide-react";
import { useTranslations } from "next-intl";

/** Routes select the financial context; this never rewrites personal store data. */
export function ContextSwitch({
  group = false,
  disabled = false,
  beforeNavigate,
}: {
  group?: boolean;
  disabled?: boolean;
  beforeNavigate?: () => boolean;
}) {
  const t = useTranslations("groups");
  return (
    <nav
      aria-label={t("context")}
      className="flex gap-1 rounded-[12px] border border-edge bg-card p-1 text-[12px] font-semibold"
    >
      <Link
        href="/home"
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled || (beforeNavigate && !beforeNavigate())) e.preventDefault();
        }}
        aria-current={!group ? "page" : undefined}
        className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[9px] px-2 ${!group ? "bg-primary-soft text-primary" : "text-muted"}`}
      >
        <LockKeyhole size={15} />
        {t("personal")}
      </Link>
      <Link
        href="/groups"
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled || (beforeNavigate && !beforeNavigate())) e.preventDefault();
        }}
        aria-current={group ? "page" : undefined}
        className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[9px] px-2 ${group ? "bg-primary-soft text-primary" : "text-muted"}`}
      >
        <Users size={15} />
        {t("title")}
      </Link>
    </nav>
  );
}
