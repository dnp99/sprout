# 016 — Installable online-first PWA

**Status:** Implemented · **Created:** 2026-07-22

Implementation is complete. Lint, ES compatibility, i18n parity, TypeScript,
and unit tests pass; the production build is currently blocked by the local
Turbopack sandbox refusing a process-port bind while emitting an app endpoint.

## Outcome

Let a user install Sprout from a supported browser and launch it from a phone
home screen, desktop dock, Start menu, or app launcher in a standalone window.
The installed app should open the authenticated product at `/home`, use Sprout's
existing cookie-based authentication, respect light/dark mode, and fit mobile
safe areas correctly. Where a platform does not carry the browser's current
session into the installed context, the existing login flow remains the fallback.

This plan delivers an **installable, online-first web app**. It does not promise
offline access, background synchronization, push notifications, or app-store
distribution. Those capabilities require separate product and security work.

## What exists today

- [`src/app/manifest.ts`](../src/app/manifest.ts) already defines the app name,
  description, `display: "standalone"`, brand colours, an SVG icon, and the
  generated Apple icon.
- [`src/app/icon.svg`](../src/app/icon.svg) and
  [`src/app/apple-icon.tsx`](../src/app/apple-icon.tsx) provide the favicon and a
  180×180 iOS home-screen icon.
- [`src/app/root-document.tsx`](../src/app/root-document.tsx) supplies responsive
  viewport and light/dark theme-colour metadata.
- The production site is served over HTTPS and the authenticated app is already
  responsive, mobile-first, and reachable at `/home`.
- Authentication uses a same-origin session cookie, so standalone launch does
  not require a second auth system.

## Gaps

1. The manifest lacks explicit 192×192 and 512×512 PNG entries used for reliable
   Chromium install promotion, plus a maskable icon for Android launchers.
2. `start_url` is `/`, which launches the public landing page instead of the app.
3. The manifest has no explicit stable `id` or `scope`.
4. There is no in-app install entry or platform-specific guidance. Installation
   is discoverable only through the browser UI.
5. Installed/standalone mode is not detected, so Settings cannot hide an install
   action after installation.
6. Mobile chrome uses safe-area insets only on the Add Transaction screen. The
   shared header and bottom tab region need standalone-mode verification.
7. There is no service worker. That is acceptable for installation, but the app
   remains network-dependent and must not claim offline support.

## Product decisions

- **Online-first:** do not add a service worker in this plan. Sprout's core data
  is authenticated and server-backed; casual caching risks stale balances and
  storing financial responses on the device.
- **Launch destination:** installed launches start at `/home`. An expired session
  follows the existing auth gate to login.
- **One app identity:** set a stable manifest `id` and root scope so changing the
  launch route later does not create a second installed app identity.
- **User-initiated install:** never auto-open an install prompt. Put **Install
  Sprout** in Settings and require a user gesture.
- **Progressive enhancement:** invoke the native Chromium prompt when available;
  otherwise show concise platform instructions. iOS uses Share → Add to Home
  Screen and does not support `beforeinstallprompt`.
- **Already installed:** hide the install action when running in standalone mode.
  Do not present an uninstall action; that belongs to the operating system.
- **No misleading claims:** use “Install Sprout” and “Open Sprout from your home
  screen” rather than “Works offline” or “Download the app.”
- **No app-store packaging:** browser/home-screen installation only. Trusted Web
  Activity, Microsoft Store, Apple App Store, and Play Store packaging are out of
  scope.

## Architecture

### 1. Production manifest and icon set

Update [`src/app/manifest.ts`](../src/app/manifest.ts) to include:

```ts
{
  id: "/",
  start_url: "/home",
  scope: "/",
  display: "standalone",
  icons: [
    { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    {
      src: "/pwa/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
}
```

- Generate the PNG assets from the existing Sprout mark; do not introduce a new
  logo. Keep the icon legible under circular, rounded-square, and Android
  maskable safe-zone crops.
- Retain the SVG favicon and 180×180 Apple icon as browser/iOS-specific assets.
- Use static colour values in the manifest because manifest files cannot consume
  CSS variables. Match the current design tokens and document this narrow
  exception in [`docs/pwa.md`](../docs/pwa.md).
- Keep one manifest for both light and dark mode. Runtime browser chrome continues
  using the media-aware viewport theme colours.

### 2. Apple and standalone metadata

Extend shared metadata in
[`src/app/root-document.tsx`](../src/app/root-document.tsx):

- `appleWebApp.capable: true`;
- `appleWebApp.title: "Sprout"`;
- an intentional iOS status-bar style verified in both themes;
- `viewportFit: "cover"` only when the shared mobile shell is safe-area aware.

Audit the shared mobile shell rather than patching each screen independently:

- top inset on the shared mobile header;
- bottom inset below the sticky tab bar/action region;
- Add Transaction's existing inset handling must not be doubled;
- modal sheets, fixed actions, and full-height screens remain reachable in
  standalone mode and landscape.

### 3. Shared install capability hook

Create a small client-only hook, for example
[`src/hooks/usePwaInstall.ts`](../src/hooks/usePwaInstall.ts), that reports:

```ts
type PwaInstallState =
  | { status: "installed" }
  | { status: "prompt-ready"; install: () => Promise<InstallOutcome> }
  | { status: "ios-instructions" }
  | { status: "browser-instructions" }
  | { status: "unavailable" };
```

- Detect installed mode with `matchMedia("(display-mode: standalone)")` and the
  iOS `navigator.standalone` fallback.
- Capture `beforeinstallprompt` only as a progressive Chromium enhancement. Keep
  the deferred event in memory, call `prompt()` only from the Settings action,
  and clear it after use.
- Listen for `appinstalled` and switch immediately to `installed`.
- Keep browser detection narrow. Prefer capability detection; use an iOS check
  only to select the correct Share-menu instructions.
- Do not persist the deferred browser event or assume a dismissed prompt can be
  reopened immediately.
- Do not render browser-only state during server rendering; avoid hydration
  mismatches.

### 4. Settings install experience

Add one shared `PwaInstallCard` used by web and mobile Settings:

- **Chromium prompt ready:** “Install Sprout” button invokes the native prompt.
- **iPhone/iPad browser:** modal with Share → Add to Home Screen → Add.
- **Desktop Safari:** explain File → Add to Dock when appropriate.
- **Other supported browser:** point to the browser's install/app menu without
  promising an in-page prompt.
- **Installed:** hide the card by default; optionally show a compact “Installed”
  status if Settings would otherwise visibly jump after installation.
- **Unavailable/insecure context:** hide the action rather than show a broken CTA.

Keep the copy in both [`src/messages/en-CA.json`](../src/messages/en-CA.json) and
[`src/messages/fr-CA.json`](../src/messages/fr-CA.json). The component should use
existing card, modal, icon, and semantic token patterns.

### 5. Privacy-safe measurement

Use the existing analytics wrapper, without user financial data:

- `pwa_install_available` once per eligible Settings view;
- `pwa_install_action_clicked` with a coarse platform (`ios`, `chromium`,
  `other`);
- `pwa_install_accepted` / `pwa_install_dismissed` where the browser exposes the
  outcome;
- `pwa_standalone_launched` once when the app boots in standalone mode.

Do not log the browser's raw user agent, session identifiers, account data, or
navigation history. If these events add little product value, omit this slice
rather than delaying installability.

## Service-worker decision

Do **not** register a service worker in this plan. Installation does not require
one, and an incomplete caching strategy is more dangerous than a clearly
online-only app.

A future offline plan must separately define:

- whether any authenticated financial data may be cached at rest;
- cache invalidation and logout/account-deletion cleanup;
- network strategy for Next.js navigations, RSC payloads, and versioned assets;
- offline read semantics and visible “data may be stale” timestamps;
- queued writes, conflict handling, duplicate prevention, and retry UX;
- an explicit deny-list for `/api/*`, CSV imports/exports, auth responses, and
  sensitive pages unless each endpoint is intentionally designed for caching.

Until then, Sprout should fail network requests normally and never imply that
transactions can be viewed or edited offline.

## Build sequence

### Slice 1 — Manifest and assets

1. Generate 192px, 512px, and maskable 512px PNG icons.
2. Add `id`, `/home` start URL, root scope, and the explicit icon entries.
3. Verify `/manifest.webmanifest` headers/content and every icon response in a
   production build.

**Exit:** Chrome/Edge application tooling recognizes Sprout as installable and
shows the correct name/icon; launching the installed app opens `/home`.

### Slice 2 — Standalone mobile polish

1. Add Apple metadata and intentional viewport behaviour.
2. Centralize shared top/bottom safe-area treatment.
3. Verify both themes, portrait/landscape, keyboard-open forms, and all sticky
   mobile actions.

**Exit:** no status-bar, home-indicator, or tab-bar overlap on iOS/Android
standalone launches.

### Slice 3 — Settings install entry

1. Add the capability hook and shared install card/modal.
2. Wire web and mobile Settings with en-CA/fr-CA copy.
3. Handle installed, prompt-ready, dismissed, iOS-instructions, generic browser,
   and unavailable states.

**Exit:** eligible users can discover installation from Settings without an
automatic prompt; installed users do not see a redundant CTA.

### Slice 4 — Verification, docs, and optional analytics

1. Add automated manifest/hook/component checks.
2. Perform the platform matrix below against the deployed HTTPS site.
3. Add privacy-safe events if retained.
4. Document installation, online-only limitations, and future service-worker
   constraints in [`docs/pwa.md`](../docs/pwa.md).

## Test matrix

### Automated

- Manifest has stable `id`, `/home` start URL, root scope, standalone display,
  and valid 192/512/maskable icon entries.
- Generated PNG files have the declared dimensions and non-empty alpha-safe
  artwork.
- Public and authenticated HTML both include the manifest link.
- Install hook: SSR/unavailable, prompt captured, accepted, dismissed,
  `appinstalled`, display-mode standalone, and iOS standalone fallback.
- Settings card: correct action/instructions per state; no action when installed
  or unavailable.
- en-CA/fr-CA catalogs remain key-synchronized.

### Manual platform verification

| Platform | Browser | Required result |
| --- | --- | --- |
| Android | Chrome | Native install prompt, correct icon, standalone `/home` launch |
| iPhone/iPad | Safari | Share-menu instructions, Add to Home Screen, safe-area layout |
| iPhone/iPad | another supported browser | Accurate Share-menu instructions or graceful fallback |
| macOS | Chrome/Edge | Browser install action, standalone app window |
| macOS | Safari 17+ | Add to Dock guidance and correct launch |
| Windows | Chrome/Edge | Install action, Start menu/taskbar icon, standalone launch |

For each supported path, verify signed-in and expired-session launch, light/dark
mode, app updates after a normal deployment, logout, account deletion, and no
claim or appearance of offline financial data.

## Acceptance criteria

- Production Sprout satisfies supported-browser installability checks over HTTPS.
- The installed app uses the correct Sprout name and icon and opens `/home` in
  standalone mode.
- Expired sessions enter the existing login flow without loops or blank screens.
- Settings offers an accurate install action or platform instructions and hides
  it once installed.
- iOS and Android standalone layouts respect status-bar and home-indicator safe
  areas in both themes.
- No service worker caches authenticated pages, API responses, CSV data, or
  financial records.
- Product copy says the app is installable but does not claim offline support,
  push notifications, or app-store availability.
- Automated checks, `npm run lint`, `npm run test`, and `npm run build` pass.
- [`docs/pwa.md`](../docs/pwa.md) records the manifest, installation flow,
  platform limitations, and explicit online-only decision.

## Out of scope

- offline transaction viewing or editing;
- background sync or queued writes;
- push notifications, badges, or notification permissions;
- app-store packaging or submission;
- share-target, file-handler, protocol-handler, or shortcuts manifest features;
- biometric authentication, passkeys, or native secure storage;
- automatic install prompts on page load;
- desktop-specific window-controls overlay.

## Expected files

```text
src/app/manifest.ts                         production install metadata
src/app/root-document.tsx                  Apple/viewport metadata
src/app/apple-icon.tsx                     retain/verify iOS icon
public/pwa/icon-192.png                     Chromium icon
public/pwa/icon-512.png                     high-resolution icon
public/pwa/icon-maskable-512.png            Android maskable icon
src/hooks/usePwaInstall.ts (+ test)         capability and prompt state
src/components/settings/PwaInstallCard.tsx  shared Settings UX
src/components/web/views/Settings.tsx       web placement
src/components/mobile/screens/Settings.tsx  mobile placement
src/components/mobile/MobileApp.tsx         shared safe-area treatment
src/messages/en-CA.json
src/messages/fr-CA.json
docs/pwa.md                                 standing behaviour/runbook
```

No database migration or new runtime dependency is expected. If a PWA library is
proposed only to add installation, reject it; the browser APIs and Next.js
manifest support are sufficient for this scope.

## References

- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: Create a standalone app](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Create_a_standalone_app)
