# 009 — Legal pages + footer trust surfaces

**Status:** Completed · **Created:** 2026-07-10 · **Completed:** 2026-07-13

## Outcome

Replace the landing footer's dead-end `#` links with real, readable legal pages
 that make Sprout feel trustworthy without over-designing or over-claiming.

## Goal

Today the landing footer in
[`src/components/landing/Landing.tsx`](../src/components/landing/Landing.tsx)
shows four legal/trust links:

- Privacy Policy
- Terms of Service
- Security
- Your data

All four currently point to `#`, and there are no dedicated routes under
[`src/app`](../src/app/). That creates three immediate product problems:

- the footer promises substance but delivers nothing
- trust-critical topics are present in name only
- the current labels (`Security`, `Your data`) are too vague to stand alone

The goal is to ship a minimal but credible legal/trust surface that:

- gives each footer link a real destination
- uses a calm reading layout instead of dashboard UI
- says only what is true today
- leaves room for later legal review without blocking implementation now

## Product direction

### 1. Use dedicated pages, not modals

These pages should open as normal routes, in the same tab, inside the marketing
site shell. They are not settings screens and should not feel like in-product
cards or overlays.

Recommended routes:

- `/privacy`
- `/terms`
- `/security`
- `/data`

This keeps the URLs obvious, linkable, and easy to reuse in onboarding, settings,
and future emails.

### 2. Keep the layout editorial, not app-like

Legal pages should prioritize reading comfort over product chrome:

- keep the normal marketing-site top nav
- center content in a narrow reading column (`~680–760px`)
- show a page title, `Last updated` line, and optional one-line summary
- use simple stacked sections with generous vertical spacing
- end with contact info and related legal links

On mobile, use the same route and content structure with tighter padding and a
simple top bar/back affordance if the nav collapses.

### 3. Tighten the information architecture

The current labels are uneven. `Privacy Policy` and `Terms of Service` are
standard. `Security` and `Your data` need sharper framing.

Recommended final labels:

- `Privacy Policy`
- `Terms of Service`
- `Security Overview`
- `Data & Deletion`

If marketing prefers shorter footer labels, the footer can still render
`Security` / `Your data` while the page H1 uses the clearer long form, but the
default should be to align both.

### 4. Ship honest v1 content, not placeholders

Do not ship empty `Coming soon` legal pages. Even short, plain-language copy is
better than a dead end.

v1 content should cover:

- what Sprout collects
- what it is used for
- how users can export or delete data
- high-level security posture
- the product's no-financial-advice stance
- a support / security contact

Use **one email everywhere in v1:** `support@sprout-money.ca`. Do not introduce
`security@...` or multiple aliases unless there is a real operational workflow
behind them. The Security Overview page should route reports to the same support
address for now.

Do not claim certifications, encryption details, retention guarantees, or vendor
controls unless they are verified.

## Current behavior

### Marketing footer

[`Landing.tsx`](../src/components/landing/Landing.tsx) currently defines:

```ts
{ label: "Privacy Policy", href: "#" }
{ label: "Terms of Service", href: "#" }
{ label: "Security", href: "#" }
{ label: "Your data", href: "#" }
```

That means the footer visually suggests maturity while functionally doing
nothing.

### Existing routes

There are no legal content routes today under [`src/app`](../src/app/). The app
has product pages like `/`, `/import`, `/settings`, etc., but nothing for footer
trust pages.

### Existing content source

We already drafted baseline copy for these four pages in-product discussion. That
copy is good enough for an implementation pass and can be refined later with
legal review.

## Proposed implementation

### Route shape

Add four standalone routes:

- [`src/app/privacy/page.tsx`](../src/app/privacy/page.tsx)
- [`src/app/terms/page.tsx`](../src/app/terms/page.tsx)
- [`src/app/security/page.tsx`](../src/app/security/page.tsx)
- [`src/app/data/page.tsx`](../src/app/data/page.tsx)

If the pages share enough structure, extract a small legal-page shell rather than
copying layout four times.

### Shared presentation layer

Create a shared component for the reading layout, for example under
`src/components/landing/` or `src/components/shared/`, responsible for:

- title
- updated-at line
- optional summary
- section rendering
- bottom related-links row
- contact block

Keep it token-based and consistent with
[`docs/design-system.md`](../docs/design-system.md):

- `bg-bg`, `text-ink`, `text-muted`
- light hairline separators via `border-edge`
- no hard-coded hex
- no dashboard card stack unless the design truly needs one

### Content model

Keep the content static for v1. No CMS or markdown pipeline is needed yet.

A simple typed data structure is enough:

- page title
- effective date / last updated string
- intro paragraph
- sections array with heading + paragraphs / bullets
- related links

That keeps content centralized and easy to revise.

### Footer wiring

Update the footer link config in
[`src/components/landing/Landing.tsx`](../src/components/landing/Landing.tsx)
to point to the real routes.

The footer should open these in the same tab. No external-link treatment.

## Content guidance by page

### Privacy Policy

Core topics:

- account info collected
- financial data users add
- usage / diagnostics data
- what data is used for
- statement that Sprout does not sell personal data
- trusted service providers
- contact email

### Terms of Service

Core topics:

- lawful use
- user responsibility for account security
- what Sprout provides
- ownership of user-submitted data
- no financial / tax / legal advice
- suspension / termination basics
- liability disclaimer

### Security Overview

Core topics:

- secure authentication and account access
- protected transport
- limited-access operational posture
- optional connected features (imports, WhatsApp, API tokens, etc.)
- how to report a security issue

This is a trust page, not a compliance page.

### Data & Deletion

Core topics:

- what user data exists in Sprout
- export capability
- deletion request process
- connected-service caveat
- retention in plain language
- contact path for deletion requests

### Contact details

Use `support@sprout-money.ca` as the contact address on all four pages:

- privacy questions
- terms / legal questions
- security issue reports
- data export / deletion requests

## Technical approach

### Shared shell first

Build one legal-page layout component so:

- spacing and typography stay consistent
- future legal pages are cheap to add
- the implementation stays under the repo's file-size guidance

### Keep routing flat

Prefer top-level route folders (`privacy`, `terms`, etc.) over a dynamic catchall
for now. This keeps the routes explicit and easier to reason about.

### Reuse the marketing shell carefully

The legal pages should feel like part of the landing site, but the page body
should switch into a quieter reading mode. Avoid reusing dashboard views or
mobile app shells.

### Mobile behavior

Treat these as first-class mobile pages:

- readable line length
- comfortable padding
- no modal overlay
- bottom related links stack vertically on narrow screens

## New / touched files

Likely new:

- `plans/009-legal-pages-and-footer-trust.md`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/security/page.tsx`
- `src/app/data/page.tsx`
- shared legal page layout/content helper(s)

Likely touched:

- `src/components/landing/Landing.tsx`
- `src/app/globals.css` only if a missing typography utility or content rhythm
  token is truly needed
- [`plans/README.md`](README.md)

## Sequencing

### Slice 1 — route and shell

- add the four routes
- add shared legal-page layout
- wire footer links to real destinations

### Slice 2 — v1 content

- insert the drafted copy for all four pages
- add `Last updated` metadata
- add related links between legal pages

### Slice 3 — polish

- tighten mobile spacing
- verify dark/light contrast
- ensure reading rhythm feels intentional on desktop and mobile

## Open questions

- Do we want `Security Overview` and `Data & Deletion` as footer labels, or only
  as page titles?
- Should the legal pages use the full landing nav, or a reduced top bar?
- Do we want a tiny in-page table of contents for long pages, or is v1 better
  without it?

## Non-goals

- full legal review or jurisdiction-specific legal drafting
- CMS-backed policy editing
- version history / changelog for legal documents
- compliance claims (SOC 2, audits, certifications) unless separately verified
- app-internal settings/legal redesign outside the landing-footer path
