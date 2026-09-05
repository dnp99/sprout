"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { EMAIL_RE, MIN_PASSWORD } from "@/lib/auth/validation";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return;
    setBusy(true);
    try {
      await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <RecoveryShell
      eyebrow={t("recoveryEyebrow")}
      title={t("forgotTitle")}
      subtitle={t("forgotSub")}
    >
      {sent ? (
        <p className="mt-5 rounded-[18px] border border-soft-border bg-primary-soft px-4 py-3 text-[13px] font-medium leading-relaxed text-primary-dark">
          {t("forgotConfirmation")}
        </p>
      ) : (
        <form className="mt-5" onSubmit={submit}>
          <input
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("email")}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy || !EMAIL_RE.test(email.trim())}
            className={buttonClass}
          >
            {busy ? t("sendingReset") : t("sendReset")}
          </button>
        </form>
      )}
      <BackToLogin />
    </RecoveryShell>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? "" : t("invalidResetLink"));
  const [complete, setComplete] = useState(false);
  const valid = Boolean(token) && password.length >= MIN_PASSWORD && password === confirm;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || t("genericError"));
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <RecoveryShell eyebrow={t("recoveryEyebrow")} title={t("resetTitle")} subtitle={t("resetSub")}>
      {complete ? (
        <>
          <p className="mt-5 rounded-[18px] border border-soft-border bg-primary-soft px-4 py-3 text-[13px] font-medium leading-relaxed text-primary-dark">
            {t("resetComplete")}
          </p>
          <Link href="/login" className={`${buttonClass} flex items-center justify-center`}>
            {t("backToLogin")}
          </Link>
        </>
      ) : (
        <form className="mt-5 flex flex-col gap-3" onSubmit={submit}>
          <PasswordField
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            placeholder={t("newPassword")}
          />
          <PasswordField
            value={confirm}
            onChange={setConfirm}
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            placeholder={t("confirmPassword")}
          />
          {password && password.length < MIN_PASSWORD && (
            <p className="px-1 text-[12px] font-semibold text-primary-dark">
              {t("passwordTooShort", { count: MIN_PASSWORD })}
            </p>
          )}
          {confirm && password !== confirm && (
            <p className="px-1 text-[12px] font-semibold text-primary-dark">
              {t("passwordsMismatch")}
            </p>
          )}
          {error && <p className="text-[13px] font-semibold text-primary-dark">{error}</p>}
          <button type="submit" disabled={busy || !valid} className={`${buttonClass} mt-1`}>
            {busy ? t("resettingPassword") : t("resetPassword")}
          </button>
        </form>
      )}
      {!complete && <BackToLogin />}
    </RecoveryShell>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  const t = useTranslations("auth");
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? t("hidePassword") : t("showPassword")}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-track/60 hover:text-ink"
      >
        {show ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}

function RecoveryShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-bg px-5 py-8">
      <div className="w-full max-w-[420px] rounded-[24px] border border-edge bg-card px-5 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
        <div className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-subtle">
          {eyebrow}
        </div>
        <h1 className="mt-3 text-[clamp(1.65rem,6vw,2rem)] font-bold leading-[1.1] tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-muted">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

function BackToLogin() {
  const t = useTranslations("auth");
  return (
    <p className="mt-5 text-center text-[13px] font-medium text-muted">
      <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
        {t("backToLogin")}
      </Link>
    </p>
  );
}

const inputClass =
  "w-full rounded-[18px] border border-edge bg-card px-4 py-3.5 text-[16px] font-medium text-ink outline-none placeholder:text-muted focus:border-primary lg:text-[14px]";
const buttonClass =
  "mt-[18px] w-full rounded-[18px] bg-primary py-4 text-center text-[15px] font-semibold text-onprimary transition disabled:opacity-50";
