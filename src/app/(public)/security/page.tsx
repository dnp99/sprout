import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { LEGAL_PAGES } from "@/lib/legal-pages";

const page = LEGAL_PAGES.security;

export const metadata: Metadata = {
  title: `Sprout — ${page.title}`,
  description: page.summary,
};

export default function SecurityPage() {
  return <LegalPage page={page} />;
}
