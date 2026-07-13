import { MarketingShell } from "./MarketingShell";
import { Faq, HandsFree, Hero, Pricing, Privacy, SmartImport, TheApp } from "./sections";

/**
 * Public marketing landing page shown at `/` to signed-out visitors (signed-in
 * users are redirected to the dashboard server-side - see `app/page.tsx`).
 *
 * A server component built from the "Sprout Landing" design handoff: no client
 * state, just content + `next/link` CTAs into the existing `/login` auth flow.
 * Everything is tokenized, so the handoff's light and dark frames both come for
 * free via the no-FOUC theme class on <html>. Sections live in `sections.tsx`
 * (content) and `mocks.tsx` (app previews); shared primitives in `ui.tsx`.
 */
export function Landing() {
  return (
    <MarketingShell>
      <main>
        <Hero />
        <SmartImport />
        <HandsFree />
        <TheApp />
        <Privacy />
        <Pricing />
        <Faq />
      </main>
    </MarketingShell>
  );
}
