"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { EMAIL_RE, MIN_PASSWORD } from "@/lib/auth/validation";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

/** The auth gate: sign up or log in. Post-signup setup (budget, goal, etc.) now
 *  happens in-app via Home activation, not here — see plans/007. The layout frame
 *  is provided by the caller (full-screen on mobile, split-screen on web). */
export function AuthFlow() {
  const t = useTranslations("auth");
  const { flowStep, set, login, signup } = useStore(
    useShallow((s) => ({
      flowStep: s.flowStep,
      set: s.set,
      login: s.login,
      signup: s.signup,
    })),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Which fields the user has left, so hints appear after interaction (not while
  // they're still mid-type on a fresh field).
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
  const touch = (field: "email" | "password" | "confirm") =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Derived validation, using the same rules the server enforces.
  const emailValid = EMAIL_RE.test(email.trim());
  const passwordLongEnough = password.length >= MIN_PASSWORD;
  const passwordsMatch = password === confirm;
  const emailError = touched.email && !emailValid ? t("emailInvalid") : "";
  const passwordError =
    touched.password && !passwordLongEnough ? `At least ${MIN_PASSWORD} characters.` : "";
  const confirmError =
    touched.confirm && confirm.length > 0 && !passwordsMatch ? t("passwordsMismatch") : "";

  const signupValid = emailValid && passwordLongEnough && passwordsMatch;
  const loginValid = emailValid && password.length > 0;

  const submit = async (action: (email: string, password: string) => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await action(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  if (flowStep === "login") {
    return (
      <AuthCard
        eyebrow={t("welcomeBack")}
        title={t("logIn")}
        subtitle={t("logInSub")}
        footer={
          <SwitchLink
            prompt={t("newHere")}
            action={t("signUp")}
            onClick={() => switchTo("signup")}
          />
        }
      >
        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(login);
          }}
        >
          <Credentials
            email={email}
            password={password}
            onEmail={setEmail}
            onPassword={setPassword}
            onBlurField={touch}
            emailError={emailError}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword((value) => !value)}
            emailAutoFocus
          />
          {error && <ErrorText>{error}</ErrorText>}
          <PrimaryButton type="submit" disabled={busy || !loginValid}>
            {busy ? t("loggingIn") : t("logIn")}
          </PrimaryButton>
        </form>
      </AuthCard>
    );
  }

  // signup (default)
  return (
    <AuthCard
      eyebrow={t("startHere")}
      title={t("createAccount")}
      subtitle={t("createAccountSub")}
      footer={
        <SwitchLink
          prompt={t("haveAccount")}
          action={t("logIn")}
          onClick={() => switchTo("login")}
        />
      }
    >
      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (signupValid) void submit(signup);
        }}
      >
        <div className="mt-5 rounded-[18px] border border-soft-border bg-primary-soft px-4 py-3 text-[12.5px] font-medium leading-relaxed text-primary-dark">
          No credit card required — set your budget once you’re in.
        </div>
        <Credentials
          email={email}
          password={password}
          confirm={confirm ?? ""}
          onEmail={setEmail}
          onPassword={setPassword}
          onConfirm={setConfirm}
          onBlurField={touch}
          emailError={emailError}
          passwordError={passwordError}
          confirmError={confirmError}
          showPassword={showPassword}
          onToggleShowPassword={() => setShowPassword((value) => !value)}
          emailAutoFocus
        />
        {error && <ErrorText>{error}</ErrorText>}
        <PrimaryButton type="submit" disabled={busy || !signupValid}>
          {busy ? t("creatingAccount") : t("createAccountBtn")}
        </PrimaryButton>
      </form>
    </AuthCard>
  );

  function switchTo(step: "login" | "signup") {
    setError("");
    setConfirm("");
    set({ flowStep: step });
  }
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-3">
      <div className="text-[clamp(1.65rem,6vw,2rem)] font-bold leading-[1.1] tracking-tight text-ink">
        {title}
      </div>
      <div className="mt-1.5 text-[13px] font-medium leading-relaxed text-muted">{subtitle}</div>
    </div>
  );
}

function Credentials({
  email,
  password,
  confirm,
  onEmail,
  onPassword,
  onConfirm,
  onBlurField,
  emailError,
  passwordError,
  confirmError,
  showPassword,
  onToggleShowPassword,
  emailAutoFocus,
}: {
  email: string;
  password: string;
  /** Confirm-password value — passing it (signup) renders the extra field. */
  confirm?: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onConfirm?: (v: string) => void;
  /** Mark a field touched on blur, so its hint only shows after interaction. */
  onBlurField: (field: "email" | "password" | "confirm") => void;
  emailError?: string;
  passwordError?: string;
  confirmError?: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  emailAutoFocus?: boolean;
}) {
  const t = useTranslations("auth");
  const signup = confirm !== undefined;
  return (
    <div className="mt-5 flex flex-col gap-3">
      <Field error={emailError}>
        <input
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t("email")}
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          onBlur={() => onBlurField("email")}
          autoFocus={emailAutoFocus}
          aria-invalid={Boolean(emailError)}
          className={inputClass(Boolean(emailError))}
        />
      </Field>
      <Field error={passwordError}>
        <PasswordInput
          value={password}
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder={t("password")}
          invalid={Boolean(passwordError)}
          onChange={onPassword}
          onBlur={() => onBlurField("password")}
          showPassword={showPassword}
          onToggleShowPassword={onToggleShowPassword}
        />
      </Field>
      {signup && (
        <Field error={confirmError}>
          <PasswordInput
            value={confirm}
            autoComplete="new-password"
            placeholder={t("confirmPassword")}
            invalid={Boolean(confirmError)}
            onChange={(value) => onConfirm?.(value)}
            onBlur={() => onBlurField("confirm")}
            showPassword={showPassword}
            onToggleShowPassword={onToggleShowPassword}
          />
        </Field>
      )}
    </div>
  );
}

/** Base input classes; borders turn primary on error to flag the field inline. */
function inputClass(invalid: boolean) {
  return `w-full rounded-[18px] border bg-card px-4 py-3.5 text-[16px] font-medium text-ink outline-none placeholder:text-muted focus:border-primary lg:text-[14px] ${
    invalid ? "border-primary" : "border-edge"
  }`;
}

/** Wraps a field and renders its inline validation hint below, when present. */
function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && (
        <div className="mt-1 px-1 text-[12px] font-semibold text-primary-dark">{error}</div>
      )}
    </div>
  );
}

function PasswordInput({
  value,
  autoComplete,
  placeholder,
  invalid,
  onChange,
  onBlur,
  showPassword,
  onToggleShowPassword,
}: {
  value: string;
  autoComplete: string;
  placeholder: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
}) {
  const t = useTranslations("auth");
  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(invalid)}
        className={`${inputClass(Boolean(invalid))} pr-12`}
      />
      <button
        type="button"
        onClick={onToggleShowPassword}
        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full text-muted transition hover:bg-track/60 hover:text-ink"
      >
        {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 text-[13px] font-semibold text-primary-dark">{children}</div>;
}

function PrimaryButton({
  onClick,
  type = "button",
  disabled,
  children,
}: {
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="mt-[18px] w-full rounded-[18px] bg-primary py-4 text-center text-[15px] font-semibold text-onprimary transition disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-edge bg-card px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.06)] lg:px-6 lg:py-6">
      <div className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-subtle">
        {eyebrow}
      </div>
      <Heading title={title} subtitle={subtitle} />
      {children}
      {footer}
    </div>
  );
}

function SwitchLink({
  prompt,
  action,
  onClick,
}: {
  prompt: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 w-full text-center text-[13px] font-bold text-muted"
    >
      {prompt} <span className="text-primary">{action}</span>
    </button>
  );
}
