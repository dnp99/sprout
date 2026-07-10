# Landing page & entry routing

Sprout serves a **public marketing landing page at `/`** to signed-out
visitors, and forwards signed-in users straight to their dashboard.

## Route model

| Route | Signed out | Signed in |
| --- | --- | --- |
| `/` | Marketing landing ([`Landing`](../src/components/landing/Landing.tsx)) | Server redirect → `/home` |
| `/login` | Auth flow (login / signup) via `AppShell` | Client redirect → `/home` |
| `/home`, `/transactions`, … | Client redirect → `/login` | The app (`WebApp` / `MobileApp`) |

The redirect on `/` happens **server-side** in
[`app/page.tsx`](../src/app/page.tsx): it reads the session cookie with
[`getSessionUser()`](../src/lib/auth/currentUser.ts) and `redirect("/home")`s
before rendering, so a logged-in visitor never sees a flash of the landing page.
Section routes and `/login` still go through the client
[`AppShell`](../src/components/AppShell.tsx) auth boundary.

## The landing component

Built from the "Sprout Landing" design handoff (four frames: desktop/mobile ×
light/dark). It's a **server component** — no client state, just content and
`next/link` CTAs that point at `/login` (the existing auth flow handles both
login and signup). Files under [`src/components/landing/`](../src/components/landing/):

- [`Landing.tsx`](../src/components/landing/Landing.tsx) — composition + sticky
  header (with `#anchor` section nav) + the four-column footer.
- [`sections.tsx`](../src/components/landing/sections.tsx) — the content
  sections, in order: **Hero**, **Smart Import** (`#features`), **Hands-free
  logging** (`#logging`, Siri + WhatsApp), **The App** (`#app`), **Private by
  default**, **Pricing** (`#pricing`, Free / Plus "coming soon"), and **FAQ**
  (`#faq`, native `<details>` accordion).
- [`mocks.tsx`](../src/components/landing/mocks.tsx) — small tokenized previews for
  the three "The App" tiles. No real data.

The **hero uses real dashboard screenshots** (`public/landing/hero-{light,dark}.webp`,
swapped by the `.dark` theme class), not a mock. Regenerate them after any
dashboard UI change with `npm run capture:landing` (needs the dev server running
and `npm run db:seed` for clean demo data) — it drives the system Chrome via
`scripts/capture-landing-hero.mjs`, logs in as the demo user, sets a budget, and
captures both themes.
- [`ui.tsx`](../src/components/landing/ui.tsx) — shared primitives (`Container`,
  `Eyebrow`, `SectionHeading`, `IconTile`, `PrimaryCta`, `GhostCta`).

It uses only design-system tokens, so **light + dark come for free** via the
no-FOUC theme class applied in [`layout.tsx`](../src/app/layout.tsx). A visitor
with no stored preference follows their device (`prefers-color-scheme`); there's
no theme toggle on the landing itself (that lives in the app's Settings). It uses
**Geist** like the rest of the app (via the layout's `--font-geist`), so the type
is consistent across landing → login → app.

The FAQ accordion is a native `<details>`/`<summary>` (no client JS, keeps the
page a server component). The nav's Features/Logging/Pricing/FAQ links are
in-page `#anchor` scrolls.

Marketing `metadata` (title + description) is exported from `app/page.tsx`.
