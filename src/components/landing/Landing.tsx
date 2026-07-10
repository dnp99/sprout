import Link from "next/link";
import {
  ArrowRight,
  LayoutGrid,
  Mic,
  MessageCircle,
  Moon,
  Repeat,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

/**
 * Public marketing landing page shown at `/` to signed-out visitors (signed-in
 * users are redirected to the dashboard server-side — see `app/page.tsx`).
 *
 * A server component: no client state, just content + links into the existing
 * `/login` auth flow. Uses the same design tokens as the app, so light/dark
 * come for free via the no-FOUC theme class on <html>.
 */
export function Landing() {
  return (
    <div className="min-h-[100svh] bg-bg text-ink">
      <Header />
      <main>
        <Hero />
        <Features />
        <Capture />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/** Sticky top nav: brand left, auth CTAs right. */
function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <span className="flex items-center gap-1.5 text-[19px] font-bold tracking-tight text-primary">
          🌱 Sprout
        </span>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-[10px] px-3 text-[14px] font-semibold text-muted transition hover:text-ink"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-[10px] bg-primary px-4 text-[14px] font-semibold text-onprimary transition hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Headline + CTAs on the left, an app preview mock on the right. */
function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-8 pt-14 sm:px-8 sm:pt-20 lg:pb-16">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-card px-3 py-1.5 text-[12.5px] font-semibold text-muted">
            🌱 Personal budgeting, made friendly
          </span>
          <h1 className="mt-5 text-[40px] font-bold leading-[1.08] tracking-tight sm:text-[52px]">
            Money that
            <br />
            grows with you.
          </h1>
          <p className="mx-auto mt-5 max-w-[460px] text-[16px] font-medium leading-relaxed text-muted lg:mx-0">
            Track spending, set goals, and budget with confidence — with a little joy along the way.
            Log expenses by voice or text, import your bank statement, and always know what&rsquo;s
            safe to spend.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/login"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-6 text-[15px] font-semibold text-onprimary transition hover:opacity-90 sm:w-auto"
            >
              Get started free
              <ArrowRight size={17} strokeWidth={2.4} />
            </Link>
            <Link
              href="/login"
              className="flex min-h-12 w-full items-center justify-center rounded-[14px] border border-edge px-6 text-[15px] font-semibold text-ink transition hover:bg-card sm:w-auto"
            >
              Log in
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] font-medium text-subtle">
            Free to start · Works on web &amp; your phone · Light &amp; dark
          </p>
        </div>
        <PhoneMock />
      </div>
    </section>
  );
}

/** A stylized preview of the app dashboard — pure tokens, mirrors the real UI. */
function PhoneMock() {
  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="rounded-[24px] border border-edge bg-card p-4 shadow-2xl">
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] font-bold text-ink">July 2026</span>
          <span className="text-[11px] font-semibold text-muted">21 days left</span>
        </div>

        {/* Safe-to-spend hero tile */}
        <div className="mt-3 rounded-[16px] bg-primary p-4 text-onprimary">
          <div className="text-[10.5px] font-semibold uppercase tracking-[.16em] opacity-80">
            Safe to spend
          </div>
          <div className="mt-1 text-[34px] font-bold tracking-tight tabular-nums">$1,840</div>
          <div className="mt-1 text-[11.5px] font-semibold opacity-85">
            Spent $1,160 · Budget $3,000
          </div>
        </div>

        {/* Category rows */}
        <div className="mt-3 flex flex-col gap-2.5">
          <MockCategory emoji="🛒" name="Groceries" pct={62} amount="$310" />
          <MockCategory emoji="🍽️" name="Dining out" pct={45} amount="$180" />
          <MockCategory emoji="🏠" name="Bills &amp; rent" pct={88} amount="$1,540" />
        </div>

        {/* A logged transaction */}
        <div className="mt-3 flex items-center gap-3 rounded-[12px] border border-edge px-3 py-2.5">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-track text-[15px]">
            ☕
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold text-ink">Blue Bottle</div>
            <div className="text-[10.5px] font-medium text-muted">Dining out · via Siri</div>
          </div>
          <span className="text-[12.5px] font-bold tabular-nums text-ink">−$4.50</span>
        </div>
      </div>
    </div>
  );
}

function MockCategory({
  emoji,
  name,
  pct,
  amount,
}: {
  emoji: string;
  name: string;
  pct: number;
  amount: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-track text-[15px] leading-none">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-ink">{name}</span>
          <span className="text-[11px] font-semibold text-muted tabular-nums">{amount}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-track">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

const FEATURES: { icon: LucideIcon; emoji: string; title: string; body: string }[] = [
  {
    icon: LayoutGrid,
    emoji: "💸",
    title: "Smart budgeting",
    body: "See what's safe to spend at a glance. Set a monthly budget and let category limits keep you on track.",
  },
  {
    icon: Target,
    emoji: "🎯",
    title: "Savings goals",
    body: "Name your goals and watch them grow. Round-ups quietly sweep spare change toward what matters.",
  },
  {
    icon: Repeat,
    emoji: "🔁",
    title: "Bills & income",
    body: "Track subscriptions, rent and paychecks so recurring money never sneaks up on you.",
  },
  {
    icon: Sparkles,
    emoji: "✨",
    title: "Smart Import",
    body: "Drop in a bank CSV — Sprout maps the columns and categorizes every transaction automatically.",
  },
  {
    icon: Mic,
    emoji: "🗣️",
    title: "Voice & text logging",
    body: "Log expenses hands-free with a Siri Shortcut, or just text them to WhatsApp. No app needed.",
  },
  {
    icon: Moon,
    emoji: "🌗",
    title: "Light & dark",
    body: "Beautiful in both. Follows your device automatically, or pick the side you like.",
  },
];

/** Feature grid. */
function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[560px] text-center">
        <h2 className="text-[30px] font-bold tracking-tight sm:text-[36px]">
          Everything you need to feel good about money
        </h2>
        <p className="mt-3 text-[15px] font-medium text-muted">
          Simple enough for daily use, powerful enough to actually change your habits.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Feature key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[14px] border border-edge bg-card p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-soft text-primary">
        <Icon size={19} strokeWidth={2} />
      </span>
      <h3 className="mt-4 text-[16px] font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-muted">{body}</p>
    </div>
  );
}

/** The differentiator: log expenses from anywhere via Siri or WhatsApp. */
function Capture() {
  return (
    <section className="border-y border-edge bg-card/50">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div>
          <span className="text-[12.5px] font-bold uppercase tracking-[.14em] text-primary">
            Log it your way
          </span>
          <h2 className="mt-3 text-[30px] font-bold tracking-tight sm:text-[36px]">
            The fastest expense is the one you never open the app for.
          </h2>
          <p className="mt-4 max-w-[440px] text-[15px] font-medium leading-relaxed text-muted">
            Dictate to Siri on the walk home, or text WhatsApp from anywhere. Sprout parses the
            amount, merchant and category, logs it, and lets you undo with a tap.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-primary px-6 text-[15px] font-semibold text-onprimary transition hover:opacity-90"
          >
            Try it free
            <ArrowRight size={17} strokeWidth={2.4} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <CaptureCard
            icon={Mic}
            channel="Siri Shortcut"
            said="Hey Siri, log coffee five dollars"
            reply="Logged $5.00 · Coffee · Dining out ✅"
          />
          <CaptureCard
            icon={MessageCircle}
            channel="WhatsApp"
            said="McDonald's 12.40"
            reply="Logged $12.40 · McDonald's · Dining out ✅ — reply U to undo"
          />
        </div>
      </div>
    </section>
  );
}

function CaptureCard({
  icon: Icon,
  channel,
  said,
  reply,
}: {
  icon: LucideIcon;
  channel: string;
  said: string;
  reply: string;
}) {
  return (
    <div className="rounded-[16px] border border-edge bg-bg p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={15} strokeWidth={2} className="text-primary" />
        <span className="text-[12px] font-bold uppercase tracking-[.1em]">{channel}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="self-end rounded-[14px] rounded-br-[4px] bg-primary px-3.5 py-2 text-[13px] font-semibold text-onprimary">
          {said}
        </div>
        <div className="self-start rounded-[14px] rounded-bl-[4px] bg-track px-3.5 py-2 text-[13px] font-semibold text-ink">
          {reply}
        </div>
      </div>
    </div>
  );
}

/** Closing call-to-action band. */
function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="overflow-hidden rounded-[24px] bg-primary px-6 py-14 text-center text-onprimary sm:px-14">
        <h2 className="mx-auto max-w-[520px] text-[30px] font-bold leading-tight tracking-tight sm:text-[38px]">
          Start growing your money today.
        </h2>
        <p className="mx-auto mt-4 max-w-[420px] text-[15px] font-semibold leading-relaxed opacity-90">
          Free to start. No credit card. Just a friendlier way to budget.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-bg px-7 text-[15px] font-bold text-primary transition hover:opacity-95"
        >
          Get started free
          <ArrowRight size={17} strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row sm:px-8">
        <span className="flex items-center gap-1.5 text-[15px] font-bold text-primary">
          🌱 Sprout
        </span>
        <span className="text-[12.5px] font-medium text-muted">
          © 2026 Sprout · Money that grows with you.
        </span>
      </div>
    </footer>
  );
}
