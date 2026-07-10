import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

/** Shared primitives for the marketing landing sections. All tokenized, so the
 *  page themes light/dark for free (matches the design handoff's four frames). */

export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** Small uppercase section label in the terracotta accent. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12px] font-bold uppercase tracking-[.14em] text-primary">
      {children}
    </span>
  );
}

export function SectionHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-bricolage text-[28px] font-bold leading-tight tracking-tight sm:text-[34px] ${className}`}
    >
      {children}
    </h2>
  );
}

/** Rounded icon chip used on feature/privacy cards. */
export function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-primary-soft text-primary">
      <Icon size={18} strokeWidth={2} />
    </span>
  );
}

/** Primary pill CTA (min 48px tall). `arrow` adds a trailing chevron. */
export function PrimaryCta({
  children,
  className = "",
  arrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  arrow?: boolean;
}) {
  return (
    <Link
      href="/login"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-primary px-6 text-[15px] font-semibold text-onprimary transition hover:opacity-90 ${className}`}
    >
      {children}
      {arrow && <ArrowRight size={17} strokeWidth={2.4} />}
    </Link>
  );
}

/** Outline/ghost CTA. `href` defaults to the auth flow but can anchor-scroll. */
export function GhostCta({
  children,
  href = "/login",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-[14px] border border-edge bg-card px-6 text-[15px] font-semibold text-ink transition hover:border-muted ${className}`}
    >
      {children}
    </Link>
  );
}
