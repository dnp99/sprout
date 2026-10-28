"use client";

import { useState } from "react";
import { ConnectedApps } from "@/components/settings/ConnectedApps";
import { Modal } from "@/components/ui/overlays";
import { FileUp, Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";

/** Short persistent feature entry points replace explanatory Home banners. */
export function TransactionCaptureActions({ mobile = false }: { mobile?: boolean }) {
  const set = useStore((s) => s.set);
  const goMobile = useStore((s) => s.goMobile);
  const t = useTranslations("checklist");
  const [voiceOpen, setVoiceOpen] = useState(false);
  return (
    <>
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t("captureTools")}
      >
        <button
          type="button"
          onClick={() => (mobile ? goMobile("connectedApps") : setVoiceOpen(true))}
          className="flex min-h-11 items-center gap-2 rounded-[10px] border border-edge bg-card px-3 text-[12.5px] font-semibold text-ink transition hover:bg-track"
        >
          <Mic size={16} strokeWidth={2} />
          {t("voiceText")}
        </button>
        <button
          type="button"
          onClick={() => (mobile ? goMobile("import") : set({ webView: "import" }))}
          className="flex min-h-11 items-center gap-2 rounded-[10px] border border-edge bg-card px-3 text-[12.5px] font-semibold text-ink transition hover:bg-track"
        >
          <FileUp size={16} strokeWidth={2} />
          {t("importStatement")}
        </button>
      </div>
      {voiceOpen && (
        <Modal title={t("voiceText")} onClose={() => setVoiceOpen(false)} width={600}>
          <div className="mt-4">
            <ConnectedApps />
          </div>
        </Modal>
      )}
    </>
  );
}
