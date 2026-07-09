"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { updateBudgetPoolApi } from "@/lib/api";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

const CATS: [string, string][] = [
  ["groceries", "🛒 Groceries"],
  ["dining", "🍽️ Dining"],
  ["transport", "🚗 Transport"],
  ["shopping", "🛍️ Shopping"],
  ["bills", "🏠 Bills"],
  ["fun", "🎬 Fun"],
];

const GOALS: [string, string][] = [
  ["em", "🛡️ Emergency fund"],
  ["vac", "🏝️ Vacation"],
  ["home", "🏠 New home"],
  ["debt", "💳 Pay off debt"],
];

/** The stepped auth + onboarding content. Layout frame is provided by the
 *  caller (full-screen on mobile, split-screen on web). */
export function AuthFlow() {
  const { flowStep, onbBudget, onbCats, onbGoal, set, finishFlow, login, signup } = useStore(
    useShallow((s) => ({
      flowStep: s.flowStep,
      onbBudget: s.onbBudget,
      onbCats: s.onbCats,
      onbGoal: s.onbGoal,
      set: s.set,
      finishFlow: s.finishFlow,
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
  const selectedCount = Object.values(onbCats).filter(Boolean).length;

  const submit = async (action: (email: string, password: string) => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await action(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  // Signup only: make sure both password fields agree before hitting the API.
  const submitSignup = () => {
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    void submit(signup);
  };

  if (flowStep === "login") {
    return (
      <AuthCard
        eyebrow="Welcome back"
        title="Log in"
        subtitle="Pick up where you left off."
        footer={
          <SwitchLink prompt="New here?" action="Sign up" onClick={() => switchTo("signup")} />
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
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword((value) => !value)}
            emailAutoFocus
          />
          {error && <ErrorText>{error}</ErrorText>}
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </PrimaryButton>
        </form>
      </AuthCard>
    );
  }

  if (flowStep === "budget") {
    return (
      <>
        <StepLabel n={1} />
        <Heading title="What’s your monthly budget?" subtitle="We’ll build your plan around it." />
        <div className="mt-6 flex items-center gap-1.5 rounded-2xl border border-[#e3d8c6] bg-card px-[18px] py-3.5">
          <span className="text-3xl font-bold text-muted">$</span>
          <input
            value={onbBudget}
            onChange={(e) => {
              setError("");
              set({ onbBudget: e.target.value });
            }}
            placeholder="4,000"
            inputMode="decimal"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full bg-transparent text-3xl font-bold text-ink outline-none placeholder:text-subtle"
          />
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <PrimaryButton
          onClick={async () => {
            const cents = parseCurrencyInput(onbBudget);
            if (cents <= 0) {
              setError("Enter a monthly budget.");
              return;
            }
            try {
              await updateBudgetPoolApi(cents);
              set((prev) => ({ user: { ...prev.user, budgetPoolCents: cents } }));
              setError("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Couldn't save your budget.");
              return;
            }
            set({ flowStep: "cats" });
          }}
        >
          Continue
        </PrimaryButton>
      </>
    );
  }

  if (flowStep === "cats") {
    return (
      <>
        <StepLabel n={2} />
        <Heading title="What do you spend on?" subtitle={`${selectedCount} selected`} />
        <div className="mt-6 flex flex-wrap gap-2.5">
          {CATS.map(([id, label]) => (
            <Pill
              key={id}
              active={Boolean(onbCats[id])}
              onClick={() => set({ onbCats: { ...onbCats, [id]: !onbCats[id] } })}
            >
              {label}
            </Pill>
          ))}
        </div>
        <PrimaryButton onClick={() => set({ flowStep: "goal" })}>Continue</PrimaryButton>
      </>
    );
  }

  if (flowStep === "goal") {
    return (
      <>
        <StepLabel n={3} />
        <Heading title="Set a savings goal" subtitle="Something to work toward." />
        <div className="mt-6 flex flex-wrap gap-2.5">
          {GOALS.map(([id, label]) => (
            <Pill key={id} active={onbGoal === id} onClick={() => set({ onbGoal: id })}>
              {label}
            </Pill>
          ))}
        </div>
        <PrimaryButton onClick={finishFlow}>Start budgeting 🌱</PrimaryButton>
      </>
    );
  }

  // signup (default)
  return (
    <AuthCard
      eyebrow="Start here"
      title="Create your account"
      subtitle="Start budgeting in under a minute."
      footer={
        <SwitchLink
          prompt="Already have an account?"
          action="Log in"
          onClick={() => switchTo("login")}
        />
      }
    >
      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          submitSignup();
        }}
      >
        <div className="rounded-[18px] border border-soft-border bg-primary-soft px-4 py-3 text-[12.5px] font-medium leading-relaxed text-primary-dark">
          No credit card required. Sprout keeps the setup short and the data model simple.
        </div>
        <Credentials
          email={email}
          password={password}
          confirm={confirm ?? ""}
          onEmail={setEmail}
          onPassword={setPassword}
          onConfirm={setConfirm}
          showPassword={showPassword}
          onToggleShowPassword={() => setShowPassword((value) => !value)}
          emailAutoFocus
        />
        {error && <ErrorText>{error}</ErrorText>}
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
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

function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!normalized) return 0;
  const numeric = Number(normalized);
  if (!isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric * 100);
}

function StepLabel({ n }: { n: number }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[.12em] text-muted">Step {n} of 3</div>
  );
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
  showPassword: boolean;
  onToggleShowPassword: () => void;
  emailAutoFocus?: boolean;
}) {
  const signup = confirm !== undefined;
  return (
    <div className="mt-5 flex flex-col gap-3">
      <input
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="Email"
        value={email}
        onChange={(e) => onEmail(e.target.value)}
        autoFocus={emailAutoFocus}
        className="rounded-[18px] border border-edge bg-card px-4 py-3.5 text-[16px] font-medium text-ink outline-none placeholder:text-muted focus:border-primary lg:text-[14px]"
      />
      <PasswordInput
        value={password}
        autoComplete={signup ? "new-password" : "current-password"}
        placeholder="Password"
        onChange={onPassword}
        showPassword={showPassword}
        onToggleShowPassword={onToggleShowPassword}
      />
      {signup && (
        <PasswordInput
          value={confirm}
          autoComplete="new-password"
          placeholder="Confirm password"
          onChange={(value) => onConfirm?.(value)}
          showPassword={showPassword}
          onToggleShowPassword={onToggleShowPassword}
        />
      )}
    </div>
  );
}

function PasswordInput({
  value,
  autoComplete,
  placeholder,
  onChange,
  showPassword,
  onToggleShowPassword,
}: {
  value: string;
  autoComplete: string;
  placeholder: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
}) {
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
        className="w-full rounded-[18px] border border-edge bg-card px-4 py-3.5 pr-12 text-[16px] font-medium text-ink outline-none placeholder:text-muted focus:border-primary lg:text-[14px]"
      />
      <button
        type="button"
        onClick={onToggleShowPassword}
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-track/60 hover:text-ink"
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

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-2xl border-2 px-4 py-2.5 text-[13px] transition ${
        active
          ? "border-primary bg-primary font-semibold text-onprimary"
          : "border-track bg-card font-semibold text-ink/70"
      }`}
    >
      {children}
    </button>
  );
}
