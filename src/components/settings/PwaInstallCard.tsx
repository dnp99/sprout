"use client";

import { Download, ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/overlays";
import { usePwaInstall } from "@/hooks/usePwaInstall";

/** Personal and Group settings consume the same document-wide install event. */
export function PwaInstallCard() {
  const t = useTranslations("settingsPage.pwa");
  const state = usePwaInstall();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  if (state.status === "unavailable" || state.status === "installed") return null;
  const busy = state.status === "prompting";
  const promptReady = state.status === "prompt-ready";
  async function install() {
    if (state.status !== "prompt-ready" || lock.current) return;
    lock.current = true;
    setError(false);
    try {
      await state.install();
    } catch {
      setError(true);
    } finally {
      lock.current = false;
    }
  }
  return (
    <>
      <section
        data-cozy-surface="butter"
        className="rounded-[14px] border border-edge bg-card p-5"
        aria-label={t("title")}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
            <Download size={17} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-ink">{t("title")}</h3>
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">
              {t("description")}
            </p>
            {state.status === "install-requested" && (
              <p role="status" className="mt-2 text-sm text-muted">
                {t("requested")}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {t("failed")}
              </p>
            )}
            {promptReady || busy ? (
              <button
                type="button"
                onClick={() => void install()}
                disabled={busy}
                className="mt-3 min-h-11 rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary disabled:opacity-60"
              >
                {busy ? t("opening") : t("install")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setInstructionsOpen(true)}
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-[9px] border border-edge px-3.5 py-2 text-[12.5px] font-semibold text-ink"
              >
                {t("howToInstall")}
                <ExternalLink size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </section>
      {instructionsOpen && (
        <Modal fixed title={t("instructionsTitle")} onClose={() => setInstructionsOpen(false)}>
          <p className="mt-3 text-[13px] font-medium leading-relaxed text-muted">
            {t(
              state.platform === "ios"
                ? "iosInstructions"
                : state.platform === "mac-safari"
                  ? "macInstructions"
                  : "browserInstructions",
            )}
          </p>
        </Modal>
      )}
    </>
  );
}
