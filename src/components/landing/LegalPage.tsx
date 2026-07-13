import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LegalPageContent } from "@/lib/legal-pages";
import { LEGAL_RELATED_LINKS, SUPPORT_EMAIL } from "@/lib/legal-pages";
import { Container } from "./ui";
import { MarketingShell } from "./MarketingShell";

/** Shared editorial reading layout for footer trust routes. It keeps legal
 *  pages in the same public shell as the landing page while using a narrower,
 *  calmer column that reads like content instead of dashboard UI. */
export function LegalPage({ page }: { page: LegalPageContent }) {
  return (
    <MarketingShell mode="reading">
      <main>
        <Container className="py-12 sm:py-16">
          <div className="mx-auto max-w-[760px]">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-muted transition hover:text-ink"
            >
              <ArrowLeft size={16} strokeWidth={2.2} />
              Back to Sprout
            </Link>

            <header className="mt-8 border-b border-edge pb-8">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">Legal</p>
              <h1 className="mt-3 text-[34px] font-bold tracking-tight text-ink sm:text-[44px]">
                {page.title}
              </h1>
              <p className="mt-4 max-w-[62ch] text-[17px] leading-8 text-muted">{page.summary}</p>
              <p className="mt-5 text-[13px] font-semibold text-subtle">
                Last updated {page.lastUpdated}
              </p>
            </header>

            <div className="mt-10 space-y-10">
              {page.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-[22px] font-bold tracking-tight text-ink">
                    {section.heading}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 text-[16px] leading-8 text-muted">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="mt-4 space-y-3 pl-5 text-[16px] leading-8 text-muted">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            <section className="mt-12 rounded-[18px] border border-edge bg-card/40 p-6 sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-subtle">
                Contact
              </p>
              <h2 className="mt-3 text-[21px] font-bold tracking-tight text-ink">
                {page.contactBlurb}
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                Email{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-semibold text-primary transition hover:opacity-85"
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                from the address associated with your Sprout account when relevant so we can verify
                and respond faster.
              </p>
            </section>

            <section className="mt-10 border-t border-edge pt-8">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-subtle">
                Related
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {LEGAL_RELATED_LINKS.filter((link) => link.href !== `/${page.slug}`).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex min-h-14 items-center justify-between rounded-[14px] border border-edge bg-card px-4 text-[14px] font-semibold text-ink transition hover:border-muted"
                  >
                    <span>{link.label}</span>
                    <ArrowRight
                      size={16}
                      strokeWidth={2.2}
                      className="text-muted transition group-hover:text-ink"
                    />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </Container>
      </main>
    </MarketingShell>
  );
}
