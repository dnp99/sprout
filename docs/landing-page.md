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
  default**, **Pricing** (`#pricing`, Free / Plus "coming soon"), **FAQ**
  (`#faq`, native `<details>` accordion), and a closing CTA.
- [`mocks.tsx`](../src/components/landing/mocks.tsx) — tokenized app previews (the
  hero dashboard + the three "The App" tiles). No real data.
- [`ui.tsx`](../src/components/landing/ui.tsx) — shared primitives (`Container`,
  `Eyebrow`, `SectionHeading`, `IconTile`, `PrimaryCta`, `GhostCta`).

It uses only design-system tokens, so **light + dark come for free** via the
no-FOUC theme class applied in [`layout.tsx`](../src/app/layout.tsx). A visitor
with no stored preference follows their device (`prefers-color-scheme`); there's
no theme toggle on the landing itself (that lives in the app's Settings).

### Typography (landing only)

The app is Geist everywhere, but the landing follows the handoff's type: **Bricolage
Grotesque** for headings and **Figtree** for body. Both are loaded via `next/font`
**inside `Landing.tsx`** (not the app layout), exposing `--font-bricolage` /
`--font-figtree` on the landing root only — so the app is unaffected and stays
Geist. They surface as the `font-bricolage` / `font-figtree` Tailwind classes
(see [`tailwind.config.ts`](../tailwind.config.ts)); `font-figtree` is the landing
base, `font-bricolage` is applied to the hero `h1`, `SectionHeading`, and wordmarks.

The FAQ accordion is a native `<details>`/`<summary>` (no client JS, keeps the
page a server component). The nav's Features/Logging/Pricing/FAQ links are
in-page `#anchor` scrolls.

Marketing `metadata` (title + description) is exported from `app/page.tsx`.
