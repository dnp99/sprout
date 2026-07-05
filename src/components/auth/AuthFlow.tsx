"use client";

import { useState } from "react";
import { useStore } from "@/state/store";

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
  const { flowStep, onbIncome, onbCats, onbGoal, set, finishFlow, login, signup } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  if (flowStep === "login") {
    return (
      <>
        <Heading title="Welcome back" subtitle="Let’s check in on your money." />
        <Credentials
          email={email}
          password={password}
          onEmail={setEmail}
          onPassword={setPassword}
        />
        {error && <ErrorText>{error}</ErrorText>}
        <PrimaryButton onClick={() => submit(login)} disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </PrimaryButton>
        <SwitchLink prompt="New here?" action="Sign up" onClick={() => switchTo("signup")} />
      </>
    );
  }

  if (flowStep === "income") {
    return (
      <>
        <StepLabel n={1} />
        <Heading
          title="What’s your monthly income?"
          subtitle="We’ll build your budget around it."
        />
        <div className="mt-6 flex items-center gap-1.5 rounded-2xl border border-[#e3d8c6] bg-card px-[18px] py-3.5">
          <span className="text-3xl font-extrabold text-muted">$</span>
          <input
            value={onbIncome}
            onChange={(e) => set({ onbIncome: e.target.value })}
            placeholder="4,000"
            inputMode="decimal"
            className="w-full bg-transparent text-3xl font-extrabold text-ink outline-none placeholder:text-subtle"
          />
        </div>
        <PrimaryButton onClick={() => set({ flowStep: "cats" })}>Continue</PrimaryButton>
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
    <>
      <Heading title="Create your account" subtitle="Start budgeting in under a minute." />
      <Credentials email={email} password={password} onEmail={setEmail} onPassword={setPassword} />
      {error && <ErrorText>{error}</ErrorText>}
      <PrimaryButton onClick={() => submit(signup)} disabled={busy}>
        {busy ? "Creating…" : "Create account"}
      </PrimaryButton>
      <SwitchLink
        prompt="Already have an account?"
        action="Log in"
        onClick={() => switchTo("login")}
      />
    </>
  );

  function switchTo(step: "login" | "signup") {
    setError("");
    set({ flowStep: step });
  }
}

function StepLabel({ n }: { n: number }) {
  return <div className="text-xs font-extrabold uppercase text-muted">Step {n} of 3</div>;
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-3">
      <div className="text-2xl font-extrabold tracking-tight text-ink">{title}</div>
      <div className="mt-1.5 text-[13px] font-semibold text-muted">{subtitle}</div>
    </div>
  );
}

function Credentials({
  email,
  password,
  onEmail,
  onPassword,
}: {
  email: string;
  password: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
}) {
  const inputClass =
    "rounded-2xl border border-[#e3d8c6] bg-card px-4 py-3.5 text-sm text-ink outline-none placeholder:text-subtle";
  return (
    <div className="mt-6 flex flex-col gap-3">
      <input
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => onEmail(e.target.value)}
        className={inputClass}
      />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => onPassword(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 text-[13px] font-semibold text-primary-dark">{children}</div>;
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-[18px] w-full rounded-2xl bg-primary py-4 text-center text-[15px] font-extrabold text-white transition disabled:opacity-50"
    >
      {children}
    </button>
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
          ? "border-primary bg-primary font-extrabold text-white"
          : "border-track bg-card font-bold text-ink/70"
      }`}
    >
      {children}
    </button>
  );
}
