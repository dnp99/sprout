import {
  ArrowLeftRight,
  Check,
  CopyCheck,
  EyeOff,
  KeyRound,
  Landmark,
  MessageCircle,
  Mic,
  Plus,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, GhostCta, IconTile, PrimaryCta, SectionHeading } from "./ui";
import { DashboardMock, MiniAppTile, MiniBudget, MiniOverview, MiniTrends } from "./mocks";

/** Hero: badge, headline, CTAs, trust line, and the app dashboard preview. */
export function Hero() {
  return (
    <section id="top" className="pt-14 sm:pt-20">
      <Container className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Now with voice &amp; text logging
        </span>
        <h1 className="mx-auto mt-6 max-w-[720px] text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[58px]">
          Budgeting that keeps up with your <span className="italic text-primary">real</span> life.
        </h1>
        <p className="mx-auto mt-5 max-w-[520px] text-[16px] font-medium leading-relaxed text-muted">
          Import any bank statement, let us tidy it up, and log a coffee just by texting. Sprout
          does the boring parts so you actually stick with it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryCta className="w-full sm:w-auto" arrow>
            Start free
          </PrimaryCta>
          <GhostCta href="#logging" className="w-full sm:w-auto">
            See how it works
          </GhostCta>
        </div>
        <p className="mt-4 text-[12.5px] font-medium text-subtle">
          Free forever for the core budget · no bank login required
        </p>
        <div className="mx-auto mt-14 max-w-4xl">
          <DashboardMock />
        </div>
      </Container>
    </section>
  );
}

const IMPORT_CARDS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Landmark,
    title: "Any bank or budget app",
    body: "Use a budget-app preset, or map any bank's CSV columns yourself.",
  },
  {
    icon: Sparkles,
    title: "Auto-categorized",
    body: "Leftover merchants get sorted into categories automatically — cached per merchant, so it's a one-time cost.",
  },
  {
    icon: ArrowLeftRight,
    title: "Flexible amounts",
    body: "Signed, debit/credit, or inflow/outflow amount columns all work.",
  },
  {
    icon: CopyCheck,
    title: "Duplicate-safe",
    body: "Re-import the same statement anytime — already-imported rows are skipped.",
  },
];

export function SmartImport() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-[600px] text-center">
          <Eyebrow>Smart Import</Eyebrow>
          <SectionHeading className="mt-3">
            Your statements in, cleaned up, in seconds
          </SectionHeading>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {IMPORT_CARDS.map((c) => (
            <div key={c.title} className="rounded-[16px] border border-edge bg-card p-5">
              <IconTile icon={c.icon} />
              <h3 className="mt-4 text-[16px] font-bold text-ink">{c.title}</h3>
              <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-muted">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

const CHANNELS: {
  icon: LucideIcon;
  channel: string;
  body: string;
  note: string;
}[] = [
  {
    icon: Mic,
    channel: "Siri Shortcut",
    body: "Just say “Hey Siri, log expense” and speak the amount — it lands in Sprout instantly, no tapping.",
    note: "Set up in seconds once you sign up",
  },
  {
    icon: MessageCircle,
    channel: "WhatsApp bot",
    body: "Text an expense like “coffee 4.50” to the Sprout bot and it's logged. Reply U to undo.",
    note: "Connect from Settings after signup",
  },
];

export function HandsFree() {
  return (
    <section id="logging" className="border-y border-edge bg-card/40 py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-[620px] text-center">
          <Eyebrow>Hands-free logging</Eyebrow>
          <SectionHeading className="mt-3">Log an expense without opening the app</SectionHeading>
          <p className="mt-4 text-[15px] font-medium leading-relaxed text-muted">
            Dictate to Siri, or text a WhatsApp bot. Numbers can be words too — “McDonald&rsquo;s
            five dollars” works.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <div key={c.channel} className="rounded-[16px] border border-edge bg-bg p-6">
              <div className="flex items-center gap-3">
                <IconTile icon={c.icon} />
                <h3 className="text-[17px] font-bold text-ink">{c.channel}</h3>
              </div>
              <p className="mt-4 text-[14px] font-medium leading-relaxed text-muted">{c.body}</p>
              <p className="mt-4 text-[12px] font-semibold text-subtle">{c.note}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function TheApp() {
  return (
    <section id="app" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-[560px] text-center">
          <Eyebrow>The app</Eyebrow>
          <SectionHeading className="mt-3">Everything in one calm place</SectionHeading>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <MiniAppTile title="Overview" caption="Safe-to-spend at a glance">
            <MiniOverview />
          </MiniAppTile>
          <MiniAppTile title="Budget" caption="Give every dollar a job">
            <MiniBudget />
          </MiniAppTile>
          <MiniAppTile title="Trends" caption="See where it goes over time">
            <MiniTrends />
          </MiniAppTile>
        </div>
      </Container>
    </section>
  );
}

const PRIVACY: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "No bank logins",
    body: "We never connect to your bank. You import a CSV you already have — nothing is pulled behind your back.",
  },
  {
    icon: EyeOff,
    title: "Never sold or shared",
    body: "Your transactions aren't sold, shared, or fed to ad trackers. Ever.",
  },
  {
    icon: KeyRound,
    title: "Revoke in one tap",
    body: "Every integration is scoped to a token you create — and can revoke any time from Settings.",
  },
];

export function Privacy() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <div className="rounded-[24px] border border-edge bg-card p-8 sm:p-12">
          <div className="max-w-[560px]">
            <Eyebrow>Private by default</Eyebrow>
            <SectionHeading className="mt-3">Your money data stays yours</SectionHeading>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {PRIVACY.map((p) => (
              <div key={p.title}>
                <IconTile icon={p.icon} />
                <h3 className="mt-4 text-[15px] font-bold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-muted">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-edge py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-[560px] text-center">
          <Eyebrow>Pricing</Eyebrow>
          <SectionHeading className="mt-3">Start free. Upgrade if it clicks.</SectionHeading>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-[18px] border border-edge bg-card p-6">
            <div className="text-[14px] font-bold text-ink">Free</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[40px] font-bold tracking-tight text-ink">$0</span>
              <span className="text-[13px] font-semibold text-muted">forever</span>
            </div>
            <ul className="mt-5 flex flex-1 flex-col gap-2.5">
              <Perk>Import &amp; AI categorize</Perk>
              <Perk>Budgets, goals &amp; trends</Perk>
              <Perk>All your history</Perk>
            </ul>
            <PrimaryCta className="mt-6 w-full" arrow>
              Start free
            </PrimaryCta>
          </div>

          {/* Plus (coming soon) */}
          <div className="flex flex-col rounded-[18px] border border-edge bg-bg p-6">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-ink">Plus</span>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[.1em] text-primary">
                Coming soon
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[40px] font-bold tracking-tight text-ink">$4</span>
              <span className="text-[13px] font-semibold text-muted">/mo</span>
            </div>
            <ul className="mt-5 flex flex-1 flex-col gap-2.5">
              <Perk>Everything in Free</Perk>
              <Perk>Voice &amp; WhatsApp logging</Perk>
              <Perk>Recurring detection</Perk>
              <Perk>Priority support</Perk>
            </ul>
            <span className="mt-6 inline-flex min-h-12 w-full cursor-default items-center justify-center rounded-[14px] border border-edge text-[15px] font-semibold text-muted">
              Coming soon
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Perk({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
      <Check size={16} strokeWidth={2.6} className="flex-none text-primary" />
      {children}
    </li>
  );
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is my banking data safe?",
    a: "Sprout never connects to your bank directly. You import a CSV you already have — nothing leaves your device without you.",
  },
  {
    q: "What does the AI cost?",
    a: "Categorization is cached per merchant, so each store is a one-time cost. Most months it rounds to pennies.",
  },
  {
    q: "Can I log expenses without opening the app?",
    a: "Yes — dictate to Siri or text a WhatsApp bot. Every capture is written instantly.",
  },
  {
    q: "Do I need a subscription?",
    a: "The core budgeting is free forever. Plus unlocks voice/text logging and unlimited history.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-edge py-20 sm:py-28">
      <Container className="max-w-3xl">
        <SectionHeading className="text-center">Questions, answered</SectionHeading>
        <div className="mt-10 flex flex-col gap-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-[14px] border border-edge bg-card px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink">
                {f.q}
                <Plus
                  size={18}
                  strokeWidth={2.2}
                  className="flex-none text-muted transition-transform group-open:rotate-45"
                />
              </summary>
              <p className="mt-3 text-[13.5px] font-medium leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-edge py-20 sm:py-28">
      <Container className="text-center">
        <SectionHeading className="mx-auto max-w-[520px] text-[32px] sm:text-[40px]">
          Give every dollar a job today
        </SectionHeading>
        <p className="mx-auto mt-4 max-w-[420px] text-[15px] font-medium text-muted">
          Free forever for the core budget. Two minutes to your first import.
        </p>
        <PrimaryCta className="mt-8" arrow>
          Start free
        </PrimaryCta>
      </Container>
    </section>
  );
}
