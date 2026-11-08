"use client";
import { useEffect, useId, useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

/** Linking requires a fresh password proof plus a verified Google round trip;
 * the existing session/account remains the destination throughout. */
export function GoogleAccountLink() {
  const t = useTranslations("auth");
  const id = useId();
  const [status, setStatus] = useState<{ enabled: boolean; linked: boolean } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
        <p
          role="status"
          className="mt-3 flex items-start gap-3 rounded-[10px] border border-edge bg-primary-soft p-3 text-body font-medium leading-relaxed text-ink"
        >
          <CheckCircle2
            size={20}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-green"
            aria-hidden="true"
          />
          <span className="min-w-0">{t("googleLinked")}</span>
        </p>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            // Read the native value so password-manager autofill is submitted even
            // when Safari does not dispatch a React change event.
            const password = new FormData(event.currentTarget).get("password");
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/api/auth/google/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, returnPath: window.location.pathname }),
              });
              const body = await response.json();
              if (!response.ok) {
                const messages = {
                  origin_rejected: "googleLinkOriginFailed",
                  session_expired: "googleLinkSessionExpired",
                  password_missing: "googleLinkPasswordMissing",
                  password_invalid: "googleLinkPasswordInvalid",
                } as const;
                const key = messages[body.code as keyof typeof messages];
                setError(key ? t(key) : t("googleLinkVerifyFailed"));
                setBusy(false);
                return;
              }
              if (typeof body.url !== "string") throw new Error();
              window.location.assign(body.url);
            } catch {
              setError(t("googleLinkVerifyFailed"));
              setBusy(false);
            }
          }}
        >
          <p className="mt-2 text-body text-muted">{t("googleLinkDescription")}</p>
          <label
            htmlFor={`${id}-password`}
            className="mt-3 block text-label font-medium text-muted"
          >
            {t("googleLinkPassword")}
          </label>
          <div className="relative mt-1.5">
            <input
              id={`${id}-password`}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={1024}
              disabled={busy}
              onChange={() => setError("")}
              className="google-link-password min-h-11 w-full rounded-[10px] border border-edge bg-bg pl-3 pr-12 py-2 text-control text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
            <button
              type="button"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-body text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-3 min-h-11 rounded-[10px] bg-primary px-4 text-control font-semibold text-onprimary disabled:opacity-50"
          >
            {busy ? t("googleLinkOpening") : t("googleLinkAction")}
          </button>
        </form>
      )}
    </section>
  );
}
