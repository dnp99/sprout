import Link from "next/link";
import { AnchorLink } from "./AnchorLink";
import { Container } from "./ui";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "Logging", href: "#logging" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

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
      { label: "About", href: "/" },
      { label: "Contact", href: "mailto:support@sprout-money.ca" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Security Overview", href: "/security" },
      { label: "Data & Deletion", href: "/data" },
    ],
  },
];

type ShellMode = "landing" | "reading";

/** Shared public marketing chrome used by the landing page and legal/trust
 *  routes. "landing" keeps same-page anchor scrolling; "reading" points those
 *  links back to the landing route so secondary pages still feel in-family. */
export function MarketingShell({
  children,
  mode = "landing",
}: {
  children: React.ReactNode;
  mode?: ShellMode;
}) {
  return (
    <div className="min-h-[100svh] bg-bg text-ink">
      <MarketingHeader mode={mode} />
      {children}
      <MarketingFooter mode={mode} />
    </div>
  );
}

function MarketingHeader({ mode }: { mode: ShellMode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-bg/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        {mode === "landing" ? (
          <AnchorLink
            href="#top"
            className="flex items-center gap-1.5 text-[19px] font-bold tracking-tight text-primary"
          >
            🌱 Sprout
          </AnchorLink>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[19px] font-bold tracking-tight text-primary"
          >
            🌱 Sprout
          </Link>
        )}

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <MarketingLink
              key={item.href}
              href={item.href}
              mode={mode}
              className="text-[13.5px] font-semibold text-muted transition hover:text-ink"
            >
              {item.label}
            </MarketingLink>
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
      </Container>
    </header>
  );
}

function MarketingFooter({ mode }: { mode: ShellMode }) {
  return (
    <footer className="border-t border-edge bg-card/40">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-[240px]">
            <span className="flex items-center gap-1.5 text-[17px] font-bold text-primary">
              🌱 Sprout
            </span>
            <p className="mt-3 text-[13px] font-medium leading-relaxed text-muted">
              Warm, private budgeting that keeps up with your real life.
            </p>
          </div>

          {FOOTER_COLS.map((column) => (
            <div key={column.title}>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-subtle">
                {column.title}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <MarketingLink
                      href={link.href}
                      mode={mode}
                      className="text-[13.5px] font-medium text-muted transition hover:text-ink"
                    >
                      {link.label}
                    </MarketingLink>
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
        </div>
      </Container>
    </footer>
  );
}

function MarketingLink({
  href,
  mode,
  className,
  children,
}: {
  href: string;
  mode: ShellMode;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  if (href.startsWith("#")) {
    if (mode === "landing") {
      return (
        <AnchorLink href={href} className={className}>
          {children}
        </AnchorLink>
      );
    }
    return (
      <Link href={`/${href}`} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
