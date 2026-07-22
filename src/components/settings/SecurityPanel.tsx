"use client";

import { KeyRound, Loader2, LogOut, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Modal } from "@/components/ui/overlays";
import { MIN_PASSWORD } from "@/lib/auth/validation";

/** Settings → Security (plan 015). Change password, sign out other devices, and
 *  delete the account. Each password-verifying action re-authenticates on the
 *  server; deletion also requires a typed confirmation. Shared by web + mobile. */
export function SecurityPanel() {
  const t = useTranslations("settingsPage.securityPanel");

  return (
    <div className="rounded-[14px] border border-edge bg-card p-5">
      <div className="flex items-center gap-2">
        <KeyRound size={16} strokeWidth={2} className="text-primary" />
        <h3 className="text-[15px] font-bold text-ink">{t("title")}</h3>
      </div>

      <ChangePassword />

      <div className="mt-5 border-t border-edge pt-4">
        <SignOutOthers />
      </div>

      <div className="mt-5 border-t border-edge pt-4">
        <DeleteAccount />
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-edge bg-track px-3 py-2 text-[13.5px] font-medium text-ink outline-none transition focus:border-primary";

/** Change-password form: current, new, confirm — validated inline with the same
 *  MIN_PASSWORD the server enforces. */
function ChangePassword() {
  const t = useTranslations("settingsPage.securityPanel");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    setError("");
    setDone(false);
    if (next.length < MIN_PASSWORD) return setError(t("errShort", { min: MIN_PASSWORD }));
    if (next !== confirm) return setError(t("errMismatch"));
    if (next === current) return setError(t("errSame"));
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? t("errGeneric"));
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="text-[13.5px] font-semibold text-ink">{t("passwordTitle")}</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <PasswordField
          label={t("current")}
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
        />
        <PasswordField
          label={t("newPassword")}
          value={next}
          onChange={setNext}
          autoComplete="new-password"
        />
        <PasswordField
          label={t("confirm")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
      </div>
      {error && <p className="mt-2 text-[12.5px] font-semibold text-primary-dark">{error}</p>}
      {done && <p className="mt-2 text-[12.5px] font-semibold text-green">{t("passwordDone")}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy || !current || !next || !confirm}
        className="mt-3 flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
      >
        {busy && <Loader2 size={14} strokeWidth={2.4} className="animate-spin" />}
        {busy ? t("saving") : t("updatePassword")}
      </button>
    </div>
  );
}

/** Sign out every other session. */
function SignOutOthers() {
  const t = useTranslations("settingsPage.securityPanel");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/sessions/revoke-others", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? t("errGeneric"));
      setMsg(body.revoked > 0 ? t("signedOutN", { count: body.revoked }) : t("noOtherSessions"));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-ink">{t("sessionsTitle")}</div>
        <div className="mt-0.5 text-[12px] font-medium text-muted">{t("sessionsDesc")}</div>
        {msg && <div className="mt-1 text-[12px] font-semibold text-muted">{msg}</div>}
      </div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="flex flex-none items-center gap-1.5 rounded-[10px] border border-edge px-3.5 py-2 text-[12.5px] font-semibold text-ink transition hover:border-soft-border disabled:opacity-50"
      >
        <LogOut size={14} strokeWidth={2} />
        {busy ? t("signingOut") : t("signOutOthers")}
      </button>
    </div>
  );
}

/** Delete-account flow behind a re-auth + typed-confirmation modal. */
function DeleteAccount() {
  const t = useTranslations("settingsPage.securityPanel");
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const CONFIRM = "DELETE";
  const ready = confirm === CONFIRM && password.length > 0 && !busy;

  async function run() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? t("errGeneric"));
      // Session is cleared server-side; hard-navigate to a public confirmation
      // for a clean slate (store, cookies, everything reset).
      window.location.href = "/account-deleted";
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errGeneric"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-ink">{t("deleteTitle")}</div>
        <div className="mt-0.5 text-[12px] font-medium text-muted">{t("deleteDesc")}</div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-none items-center gap-1.5 rounded-[10px] border border-soft-border px-3.5 py-2 text-[12.5px] font-semibold text-primary-dark transition hover:bg-primary-soft"
      >
        <Trash2 size={14} strokeWidth={2} />
        {t("deleteAccount")}
      </button>

      {open && (
        <Modal title={t("deleteModalTitle")} onClose={() => (busy ? null : setOpen(false))}>
          <div className="mt-3">
            <p className="text-[13px] font-medium leading-relaxed text-muted">
              {t("deleteWarning")}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[12.5px] font-medium text-muted">
              <li>{t("deleteItemTxns")}</li>
              <li>{t("deleteItemBudget")}</li>
              <li>{t("deleteItemConnections")}</li>
            </ul>
            <div className="mt-4 flex flex-col gap-3">
              <PasswordField
                label={t("deletePasswordLabel")}
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
                  {t("deleteConfirmLabel", { phrase: CONFIRM })}
                </span>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`mt-1 ${inputClass}`}
                  placeholder={CONFIRM}
                  autoCapitalize="characters"
                />
              </label>
            </div>
            {error && <p className="mt-2 text-[12.5px] font-semibold text-primary-dark">{error}</p>}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-[10px] px-3.5 py-2 text-[12.5px] font-semibold text-muted transition hover:text-ink disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={run}
                disabled={!ready}
                className="flex items-center gap-1.5 rounded-[10px] bg-primary-dark px-4 py-2 text-[12.5px] font-semibold text-onprimary disabled:opacity-40"
              >
                {busy && <Loader2 size={14} strokeWidth={2.4} className="animate-spin" />}
                {busy ? t("deleting") : t("deleteConfirmCta")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`mt-1 ${inputClass}`}
      />
    </label>
  );
}
