"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, LoaderCircle, Palette, Receipt, Sparkles, Users } from "lucide-react";
import { Modal } from "@/components/ui/overlays";
import { useDesktop } from "@/hooks/useDesktop";
import { CURRENT_RELEASE, hasUnseenRelease } from "@/lib/whats-new";
import { useStore } from "@/state/store";

const symbols = { settlements: Users, entry: Receipt, appearance: Palette };

/** One account acknowledgement covers both dismissal and following a release highlight. */
function WhatsNewDialog({ onDone }: { onDone: () => void }) {
  const t = useTranslations("whatsNew");
  const locale = useStore((s) => s.locale);
  const seen = useStore((s) => s.user.whatsNewSeenVersion);
  const acknowledge = useStore((s) => s.acknowledgeRelease);
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  const finish = async (href?: string) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      if (hasUnseenRelease(seen)) await acknowledge(CURRENT_RELEASE.version);
      onDone();
      if (href) router.push(href);
    } catch {
      setError(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const date = new Date(`${CURRENT_RELEASE.publishedOn}T12:00:00Z`).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  // Keep the overlay outside responsive Settings trees when the viewport changes.
  return createPortal(
    <div data-ledger-context={pathname.startsWith("/groups") ? "group" : "personal"}>
      <Modal title={t("title")} subtitle={date} width={480} onClose={() => void finish()}>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{t("intro")}</p>
        <div className="mt-5 space-y-3">
          {CURRENT_RELEASE.highlights.map((item) => {
            const Icon = symbols[item.key];
            return (
              <section key={item.key} className="rounded-[14px] border border-edge bg-track p-4">
                <div className="flex items-start gap-3">
                  <Icon
                    size={17}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">{t(`${item.key}.title`)}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">
                      {t(`${item.key}.body`)}
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void finish(item.href)}
                      className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-primary disabled:opacity-50"
                    >
                      {t(`${item.key}.action`)}
                      <ArrowUpRight size={15} strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {t("saveFailed")}
          </p>
        )}
        <button
          type="button"
          onClick={() => void finish()}
          disabled={busy}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-3 text-sm font-semibold text-onprimary disabled:opacity-50"
        >
          {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          {t(busy ? "saving" : "gotIt")}
        </button>
      </Modal>
    </div>,
    document.body,
  );
}

/** Desktop replaces the automatic install offer; active forms always keep their focus. */
export function WhatsNewPrompt() {
  const desktop = useDesktop();
  const userId = useStore((s) => s.user.id);
  const seen = useStore((s) => s.user.whatsNewSeenVersion);
  const [open, setOpen] = useState(false);
  const unseen = hasUnseenRelease(seen);
  useEffect(() => {
    if (!desktop || !unseen) return;
    let timer: ReturnType<typeof setTimeout>;
    const offer = () => {
      if (document.hidden || document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        timer = setTimeout(offer, 3000);
      } else setOpen(true);
    };
    timer = setTimeout(offer, 3000);
    return () => clearTimeout(timer);
  }, [desktop, unseen, userId]);
  if (!desktop || !unseen || !open) return null;
  return <WhatsNewDialog key={userId} onDone={() => setOpen(false)} />;
}

/** Manual access stays available after dismissal, on desktop and phones. */
export function WhatsNewCard() {
  const t = useTranslations("whatsNew");
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-[14px] border border-edge bg-card p-5">
      <div className="flex items-start gap-3">
        <Sparkles size={17} strokeWidth={2} className="mt-0.5 shrink-0 text-primary" aria-hidden />
        <div>
          <h3 className="text-[15px] font-bold text-ink">{t("title")}</h3>
          <p className="mt-1 text-[13px] text-muted">{t("settingsDescription")}</p>
          <button
            type="button"
            className="mt-3 min-h-11 rounded-[10px] border border-edge px-4 py-2 text-[13px] font-semibold text-ink hover:bg-track"
            onClick={() => setOpen(true)}
          >
            {t("viewUpdates")}
          </button>
        </div>
      </div>
      {open && <WhatsNewDialog onDone={() => setOpen(false)} />}
    </section>
  );
}
