import Link from "next/link";
import { Faq, HandsFree, Hero, Pricing, Privacy, SmartImport, TheApp } from "./sections";

/**
 * Public marketing landing page shown at `/` to signed-out visitors (signed-in
 * users are redirected to the dashboard server-side — see `app/page.tsx`).
 *
 * A server component built from the "Sprout Landing" design handoff: no client
 * state, just content + `next/link` CTAs into the existing `/login` auth flow.
 * Everything is tokenized, so the handoff's light and dark frames both come for
 * free via the no-FOUC theme class on <html>. Sections live in `sections.tsx`
 * (content) and `mocks.tsx` (app previews); shared primitives in `ui.tsx`.
 */
export function Landing() {
  return (
    <div className="min-h-[100svh] bg-bg text-ink">
      <Header />
      <main>
        <Hero />
        <SmartImport />
        <HandsFree />
        <TheApp />
        <Privacy />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

const NAV = [
  { label: "Features", href: "#features" },
  { label: "Logging", href: "#logging" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

/** Sticky top nav: brand, section anchors (desktop), auth CTAs. */
function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="#top"
          className="flex items-center gap-1.5 text-[19px] font-bold tracking-tight text-primary"
        >
          🌱 Sprout
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-[13.5px] font-semibold text-muted transition hover:text-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden min-h-11 items-center rounded-[10px] px-3 text-[14px] font-semibold text-muted transition hover:text-ink sm:flex"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-[10px] bg-primary px-4 text-[14px] font-semibold text-onprimary transition hover:opacity-90"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Smart Import", href: "#features" },
      { label: "Voice & text logging", href: "#logging" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "mailto:hello@sprout-money.ca" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security", href: "#" },
      { label: "Your data", href: "#" },
    ],
  },
];

function Footer() {
  return (
    <footer className="border-t border-edge bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-[240px]">
            <span className="flex items-center gap-1.5 text-[17px] font-bold text-primary">
              🌱 Sprout
            </span>
            <p className="mt-3 text-[13px] font-medium leading-relaxed text-muted">
              Warm, private budgeting that keeps up with your real life.
            </p>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-subtle">
                {col.title}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[13.5px] font-medium text-muted transition hover:text-ink"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-edge pt-6 sm:flex-row sm:items-center">
          <span className="text-[12.5px] font-medium text-muted">
            © 2026 Sprout Money Inc. · Made with care in Toronto
          </span>
          <div className="flex items-center gap-5 text-[12.5px] font-medium text-muted">
            <a href="mailto:hello@sprout-money.ca" className="transition hover:text-ink">
              hello@sprout-money.ca
            </a>
            <a href="#" className="transition hover:text-ink">
              Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
