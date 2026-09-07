"use client";

import { Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/overlays";
import { usePwaInstall } from "@/hooks/usePwaInstall";

/** Shared install entry for web and mobile Settings. */
export function PwaInstallCard() {
  const t = useTranslations("settingsPage.pwa");
  const installState = usePwaInstall();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (installState.status === "unavailable" || installState.status === "installed") return null;

  async function install() {
    if (installState.status !== "prompt-ready" || busy) return;
    setBusy(true);
    await installState.install();
    setBusy(false);
  }

  const promptReady = installState.status === "prompt-ready";
  return (
    <>
      <div className="rounded-[14px] border border-edge bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primary-soft text-primary">
            <Download size={17} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-ink">{t("title")}</h3>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[.08em] text-primary">
              {t("comingSoon")}
            </div>
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">
              {t("description")}
            </p>
            {promptReady ? (
              <button
                type="button"
                onClick={install}
                disabled={busy}
                className="mt-3 rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary disabled:opacity-60"
              >
                {busy ? t("opening") : t("install")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setInstructionsOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-[9px] border border-edge px-3.5 py-2 text-[12.5px] font-semibold text-ink"
              >
                {t("howToInstall")} <ExternalLink size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
      {instructionsOpen && (
        <Modal title={t("instructionsTitle")} onClose={() => setInstructionsOpen(false)}>
          <p className="mt-3 text-[13px] font-medium leading-relaxed text-muted">
            {installState.status === "ios-instructions"
              ? t("iosInstructions")
              : t("browserInstructions")}
          </p>
        </Modal>
      )}
    </>
  );
}
