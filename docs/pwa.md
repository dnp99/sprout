# Progressive Web App

Sprout is an installable, **online-first** PWA for Personal and Group ledgers.
Installation opens the same app in a focused window. Financial records still
come from the server; installation does not add offline access or queued writes.

## Identity and install behavior

[`src/app/manifest.ts`](../src/app/manifest.ts) defines one stable app identity
(`id: "/"`), `/home` start URL, root scope and standalone display. The declared
192px, 512px and maskable 512px PNGs are in `public/pwa/`; the SVG favicon and
Apple touch icon are also retained. The shared
[`root-document.tsx`](../src/app/root-document.tsx) provides Apple web-app
metadata and `viewport-fit: cover` for public and localized layouts.

[`root-document.tsx`](../src/app/root-document.tsx) captures an unusually early
install event in a short head bootstrap until hydration starts. Then
[`PwaRuntime`](../src/components/settings/PwaRuntime.tsx) starts a single
document-level controller from the shared root shell. It catches
`beforeinstallprompt` before a user visits Settings, shares the one-use event
between Personal and Group contexts, and clears listeners on teardown. The
controller trusts the browser event for native prompting; user-agent detection
only chooses written instructions. A consumed prompt cannot be reused. Accepted
requests remain pending until the browser reports installation or standalone
mode. Rejected native prompts return to a recoverable guidance state.

Personal and Group settings use the same
[`PwaInstallCard`](../src/components/settings/PwaInstallCard.tsx). It hides when
installation is unavailable or already active, never prompts automatically,
and offers platform guidance for iOS/iPadOS, macOS Safari and other browsers.
Copy states that an internet connection is needed. Native installation and
instructions still depend on the platform/browser; no browser is promised an
in-page install prompt.

## Shell, viewport and appearance

The shared PWA presentation runtime tracks the visual viewport when browser
chrome or the on-screen keyboard changes its size. Shared dialogs use that
visible viewport, trap keyboard focus, support Escape, restore focus and handle
nested scroll locks. Personal and Group shells add their safe-area insets at
navigation and bottom-action boundaries. The runtime also updates browser
`theme-color` metadata from the resolved CSS background, including explicit
theme and visual-palette changes. Static manifest/splash colors remain fixed
metadata; they cannot follow a later user preference.

These behaviors have source-level and local browser coverage only. Actual
installed launches, native keyboards, notches, home indicators, icon cropping
and browser chrome still require checks on physical supported devices.

## Session and freshness behavior

On a visible resume, focus, return from the back/forward cache, or reconnect,
[`useSessionResume`](../src/hooks/useSessionResume.ts) first checks the current
authenticated user. A revoked or changed account clears financial state and
requires sign-in again. For the same account, Personal read-only views refresh
when no editing surface is active. Group refresh signals go through the existing
group loader and preserve active drafts. Resume handling is read-only: it never
submits a mutation, repeats a settlement, recalculates Split, or schedules a
retry. Group polling remains an in-memory refresh mechanism, not offline sync.

The personal loader in
[`personal-loader.ts`](../src/state/personal-loader.ts) aborts superseded reads
and rejects late responses after logout or identity changes. `clearSessionState`
also clears group caches and financial state while preserving device-level
appearance, locale and edited-highlight preferences. Authenticated HTML/RSC,
API and CSV responses use `private, no-store`; versioned static assets keep
Next.js asset caching. These policies do not claim to erase browser history or
every in-memory snapshot.

## Storage and network boundary

No service worker, financial IndexedDB store, offline launch fallback,
Cache Storage strategy, persistent mutation queue or background sync is
implemented. Financial saves need a server response. Installation uses the
existing same-origin session cookie and does not bypass account, membership or
revision checks; an installed context may ask the user to sign in.

The future offline direction is tracked separately in
[plan 023](../plans/023-together-fusion.md). It requires explicit identity
isolation, freshness, conflict resolution, idempotent retry, unsent-work recovery
and storage-upgrade contracts before it is implemented. Do not treat installed
mode or an online resume refresh as offline support.

The remaining implementation and native release checks are tracked in the
[PWA plan](../plans/016-installable-online-first-pwa.md).
