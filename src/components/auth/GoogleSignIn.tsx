"use client";
import { Info } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

/** Full-page OAuth navigation works in installed PWAs without popup cookies or
 * third-party scripts. Hide the option until server credentials are configured. */
export function GoogleSignIn() {
  const t = useTranslations("auth");
  const [enabled, setEnabled] = useState(false);
  const params = useSearchParams();
  const error = params.get("google_error");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/google/config", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (!controller.signal.aborted) setEnabled(value?.enabled === true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-[12px] border border-edge bg-track p-3 text-body leading-relaxed text-ink"
        >
          <Info size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <p>
            {t(
              error === "existing"
                ? "googleExisting"
                : error === "cancelled"
                  ? "googleCancelled"
                  : "googleFailed",
            )}
          </p>
        </div>
      )}
      {enabled && (
        <div>
          <a
            href="/api/auth/google/start"
            className="flex min-h-11 w-full items-center justify-center gap-3 rounded-[12px] border border-edge bg-card px-4 text-control font-semibold text-ink hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white">
              <Image src="/google-logo.png" width={20} height={20} alt="" />
            </span>
            {t("googleContinue")}
          </a>
          <div className="my-5 flex items-center gap-3 text-meta text-muted">
            <span className="h-px flex-1 bg-edge" />
            <span>{t("orEmail")}</span>
            <span className="h-px flex-1 bg-edge" />
          </div>
        </div>
      )}
    </>
  );
}
