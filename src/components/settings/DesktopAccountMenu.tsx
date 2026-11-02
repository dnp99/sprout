"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Bell, ChevronUp, LogOut, Palette, Shield, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover } from "@/components/ui/Popover";
import { Modal } from "@/components/ui/overlays";
import { AccountSettings, type AccountSection } from "./AccountSettings";

const sections = [
  { id: "profile", label: "accountProfile", icon: UserRound },
  { id: "appearance", label: "appearance", icon: Palette },
  { id: "security", label: "security", icon: Shield },
  { id: "notifications", label: "notifications", icon: Bell },
] as const;

/** Account access stays separate from ledger Settings and never navigates away
 * from an active group. Existing account forms and the logout route own changes. */
export function DesktopAccountMenu({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("settingsPage");
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<AccountSection | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);
  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);
  const selected = sections.find((item) => item.id === section);
  return (
    <>
      <Popover open={open} onClose={close}>
        <button
          ref={trigger}
          type="button"
          aria-label={t("account")}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          title={compact ? t("account") : undefined}
          onClick={() => setOpen(!open)}
          className={`flex min-h-11 w-full items-center gap-2 rounded-[10px] px-3 text-[13px] font-medium text-ink transition hover:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${compact ? "justify-center px-0" : ""}`}
        >
          <UserRound size={17} strokeWidth={2} />
          {!compact && (
            <>
              <span className="flex-1 text-left">{t("account")}</span>
              <ChevronUp size={15} className={open ? "rotate-180" : ""} />
            </>
          )}
        </button>
        {open && (
          <div
            ref={menu}
            id={id}
            role="menu"
            aria-label={t("account")}
            className="absolute bottom-full left-0 z-[60] mb-2 w-60 rounded-[14px] border border-edge bg-card p-1.5 text-ink shadow-lg"
            onKeyDown={(event) => {
              const items = [
                ...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
              ];
              const index = items.indexOf(document.activeElement as HTMLElement);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? items.length - 1
                    : event.key === "ArrowDown"
                      ? (index + 1) % items.length
                      : event.key === "ArrowUp"
                        ? (index - 1 + items.length) % items.length
                        : undefined;
              if (next !== undefined) {
                event.preventDefault();
                items[next]?.focus();
              }
            }}
          >
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setSection(id);
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left text-[13px] font-medium hover:bg-track focus-visible:bg-track focus-visible:outline-none"
              >
                <Icon size={16} strokeWidth={2} />
                {t(label)}
              </button>
            ))}
            <div className="mt-1 border-t border-edge pt-1">
              <a
                role="menuitem"
                href="/logout"
                className="flex min-h-11 items-center gap-3 rounded-[8px] px-3 text-[13px] font-medium text-danger hover:bg-track focus-visible:bg-track focus-visible:outline-none"
              >
                <LogOut size={16} strokeWidth={2} />
                {t("logout")}
              </a>
            </div>
          </div>
        )}
      </Popover>
      {section && selected && (
        <Modal
          title={t(selected.label)}
          width={760}
          onClose={() => {
            setSection(null);
            trigger.current?.focus();
          }}
        >
          <AccountSettings section={section} />
        </Modal>
      )}
    </>
  );
}
