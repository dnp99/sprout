"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Navigation, NavigationItem } from "@/components/ui/Navigation";
import { useDesktop } from "@/hooks/useDesktop";

export type SettingsSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  area?: "ledger" | "app" | "management";
  content: ReactNode;
};

/** Unknown fragments leave the index intact; the capture checklist's original
 * anchor remains a supported destination after introducing section navigation. */
export function settingsSectionFromHash(hash: string, ids: readonly string[]) {
  const value = hash === "#connected-apps" ? "connected-apps" : hash.replace(/^#settings-/, "");
  return ids.includes(value) ? value : null;
}

/** Keep visited panels mounted to preserve drafts and one-time token displays.
 * Mobile shows an index; desktop selects the first section beside its rail. */
export function SettingsWorkspace({
  sections,
  busy = false,
}: {
  sections: SettingsSection[];
  busy?: boolean;
}) {
  const t = useTranslations("settingsNavigation");
  const desktop = useDesktop();
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [visited, setVisited] = useState<string[]>(sections[0] ? [sections[0].id] : []);
  const heading = useRef<HTMLHeadingElement>(null);
  const index = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  const active = selected ?? (desktop ? sections[0]?.id : null);
  const ids = sections.map((section) => section.id).join("|");
  useEffect(() => {
    let initial = true;
    const read = () => {
      if (!initial) focusNext.current = true;
      initial = false;
      const next = settingsSectionFromHash(window.location.hash, ids.split("|"));
      setSelected(next);
      if (next)
        setVisited((previous) => (previous.includes(next) ? previous : [...previous, next]));
    };
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, [ids]);
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    if (active) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.parentElement?.scrollIntoView({ block: "start" });
    } else {
      index.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
      index.current?.scrollIntoView({ block: "start" });
    }
  }, [active]);
  function select(next: string | null) {
    if (busy) return;
    // Mobile sections are real destinations: both the visible Back control and
    // system Back return to the index without leaving ledger Settings.
    if (!desktop && !next && window.history.state?.__sproutSettingsPanel) {
      window.history.back();
      return;
    }
    // The outgoing desktop default must stay mounted too, even without a hash.
    setVisited((previous) => [
      ...new Set([...previous, ...(active ? [active] : []), ...(next ? [next] : [])]),
    ]);
    focusNext.current = true;
    setSelected(next);
    const hash = next ? `#settings-${next}` : "";
    const method = !desktop && next ? "pushState" : "replaceState";
    window.history[method](
      { ...window.history.state, __sproutSettingsPanel: !desktop && !!next },
      "",
      `${window.location.pathname}${window.location.search}${hash}`,
    );
  }
  const current = sections.find((section) => section.id === active);
  return (
    <div className="mx-auto w-full max-w-[1120px] lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div
        ref={index}
        className={`${active ? "hidden lg:block" : ""} scroll-mt-20 lg:sticky lg:top-4`}
      >
        <Navigation
          aria-label={t("title")}
          layout="rail"
          className="rounded-[14px] border border-edge bg-card p-2"
        >
          {(["ledger", "app", "management"] as const).map((area) => {
            const items = sections.filter((section) => (section.area ?? "ledger") === area);
            if (!items.length) return null;
            return (
              <div key={area} className="mb-3 last:mb-0">
                <p className="px-3 pb-2 pt-3 text-label font-semibold text-muted">{t(area)}</p>
                {items.map(({ id: key, label, icon: Icon }) => (
                  <NavigationItem
                    key={key}
                    active={active === key}
                    label={label}
                    icon={<Icon size={16} strokeWidth={2} />}
                    trailing={<ChevronRight size={15} className="ml-auto shrink-0 lg:hidden" />}
                    aria-controls={`${id}-${key}`}
                    disabled={busy}
                    onClick={() => select(key)}
                  />
                ))}
              </div>
            );
          })}
        </Navigation>
      </div>
      <div className="min-w-0">
        {current && (
          <div className="mb-4 lg:mb-0">
            <button
              type="button"
              disabled={busy}
              onClick={() => select(null)}
              className="mb-2 flex min-h-11 items-center gap-2 text-body font-medium text-muted hover:text-ink lg:hidden"
            >
              <ArrowLeft size={16} />
              {t("back")}
            </button>
            <h2 ref={heading} tabIndex={-1} className="sr-only">
              {current.label}
            </h2>
          </div>
        )}
        {sections.map((section) => (
          <div
            key={section.id}
            id={`${id}-${section.id}`}
            hidden={active !== section.id}
            className="space-y-4"
          >
            {(active === section.id || visited.includes(section.id)) && section.content}
          </div>
        ))}
      </div>
    </div>
  );
}
