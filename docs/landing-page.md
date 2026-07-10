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

[`Landing`](../src/components/landing/Landing.tsx) is a **server component** — no
client state, just content and `next/link` CTAs that point at `/login` (the
existing auth flow handles both login and signup). Sections: sticky header,
hero + app-preview mock, feature grid, a voice/text capture highlight (Siri +
WhatsApp), a closing CTA band, and a footer.

It uses only design-system tokens, so **light + dark come for free** via the
no-FOUC theme class applied in [`layout.tsx`](../src/app/layout.tsx). A visitor
with no stored preference follows their device (`prefers-color-scheme`); there's
no theme toggle on the landing itself (that lives in the app's Settings).

Marketing `metadata` (title + description) is exported from `app/page.tsx`.
