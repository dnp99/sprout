# Legal pages

Sprout exposes four public legal / trust routes in the marketing shell:

- `/privacy`
- `/terms`
- `/security`
- `/data`

These routes are intentionally plain-language v1 pages. They exist to make the
landing footer's trust links real, readable, and honest without pretending
Sprout has legal or compliance machinery it does not have yet.

## Shared shell

All public marketing routes use the shared
[`MarketingShell`](../src/components/landing/MarketingShell.tsx):

- the landing page uses `mode="landing"` so `#features`, `#logging`, `#pricing`,
  and `#faq` stay as in-page anchor scrolls
- legal routes use `mode="reading"` so those same nav/footer links bounce back
  to the landing page (`/#features`, etc.) instead of becoming dead anchors

That keeps the public chrome consistent while letting the legal pages use a
different content treatment.

## Reading layout

The legal routes render through
[`LegalPage`](../src/components/landing/LegalPage.tsx), which provides:

- a narrow editorial reading column
- page title, summary, and `Last updated`
- stacked content sections with paragraphs and optional bullets
- a single support contact block
- related legal links at the bottom

This layout is intentionally not dashboard-like. The goal is readability and
trust, not app chrome.

## Content model

Static page copy lives in [`src/lib/legal-pages.ts`](../src/lib/legal-pages.ts)
as typed data:

- `slug`
- `title`
- `summary`
- `lastUpdated`
- `contactBlurb`
- `sections[]`

Each section can contain:

- `paragraphs`
- `bullets`

Centralizing the content keeps metadata, route rendering, and future footer or
settings reuse aligned.

## Contact path

v1 uses one support address everywhere:

- `support@sprout-money.ca`

That same address is used for:

- privacy questions
- terms questions
- security reports
- export / deletion requests

We intentionally avoid separate aliases like `security@...` until there is a
real operational workflow behind them.
