"use client";
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
        <p role="alert" className="mb-3 text-body text-danger">
          {t(
            error === "existing"
              ? "googleExisting"
              : error === "cancelled"
                ? "googleCancelled"
                : "googleFailed",
          )}
        </p>
      )}
      {enabled && (
        <div className="mb-4">
          <a
            href="/api/auth/google/start"
            className="flex min-h-11 w-full items-center justify-center rounded-[12px] border border-edge bg-card px-4 text-control font-semibold text-ink hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {t("googleContinue")}
          </a>
          <p className="mt-3 text-center text-meta text-muted">{t("orEmail")}</p>
        </div>
      )}
    </>
  );
}
