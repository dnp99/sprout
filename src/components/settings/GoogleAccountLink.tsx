"use client";
import { useEffect, useId, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

/** Linking requires a fresh password proof plus a verified Google round trip;
 * the existing session/account remains the destination throughout. */
export function GoogleAccountLink() {
  const t = useTranslations("auth");
  const id = useId();
  const [status, setStatus] = useState<{ enabled: boolean; linked: boolean } | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/auth/google/link", {
          signal: controller.signal,
          cache: "no-store",
        });
        const value = response.ok ? await response.json() : null;
        if (!controller.signal.aborted && value) setStatus(value);
      } catch {
        /* Unavailable configuration must not break other security controls. */
      }
    })();
    return () => controller.abort();
  }, []);
  if (!status?.enabled) return null;
  return (
    <section className="mt-5 border-t border-edge pt-4" aria-labelledby={id}>
      <h4 id={id} className="text-body font-semibold text-ink">
        {t("googleAccount")}
      </h4>
      {status.linked ? (
        <p role="status" className="mt-2 flex items-center gap-2 text-body text-ink">
          <CheckCircle2 size={16} aria-hidden="true" />
          {t("googleLinked")}
        </p>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/api/auth/google/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, returnPath: window.location.pathname }),
              });
              const body = await response.json();
              setPassword("");
              if (!response.ok || typeof body.url !== "string") throw new Error();
              window.location.assign(body.url);
            } catch {
              setError(t("googleLinkVerifyFailed"));
              setBusy(false);
            }
          }}
        >
          <p className="mt-2 text-body text-muted">{t("googleLinkDescription")}</p>
          <label className="mt-3 grid gap-1.5 text-label font-medium text-muted">
            {t("googleLinkPassword")}
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={1024}
              value={password}
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 w-full rounded-[10px] border border-edge bg-bg px-3 py-2 text-control text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </label>
          {error && (
            <p role="alert" className="mt-2 text-body text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !password}
            className="mt-3 min-h-11 rounded-[10px] bg-primary px-4 text-control font-semibold text-onprimary disabled:opacity-50"
          >
            {busy ? t("googleLinkOpening") : t("googleLinkAction")}
          </button>
        </form>
      )}
    </section>
  );
}
