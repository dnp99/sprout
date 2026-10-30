# 016 — Installable PWA: current baseline and next work

**Status:** Online-first implementation in progress; native release verification remains open.
**Created:** 2026-07-22 · **Reviewed:** 2026-10-29.

This review covers `develop` at `36d9844` plus the current local category,
confirmation, navigation, Goals and Recurring changes and the local PWA
implementation. Local source is not proof of deployed behavior or native-device
verification. Do not treat this work as deployed or pushed.

## Outcome and scope

Sprout should install as one app, open `/home` in a standalone window, and support
both independent Personal and Group ledgers. Group navigation adds Split & Settle
and membership controls. Installation uses the existing same-origin session
cookie; an installed browser context may still require login.

The current implementation pass finishes the **online-first** PWA behavior.
Offline financial access is a separate capability: the approved direction in
[023](023-together-fusion.md) includes it, but no offline store or synchronization
exists today. The offline workstream below preserves that direction without
mistaking installation for offline support.

Do not rebuild completed foundation work, add an install-only dependency, change
manifest identity, or upgrade the pinned Next.js 16.1.7 as a side effect.

## Verified source baseline

| Area              | Actual state on review                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manifest          | `src/app/manifest.ts`: stable `id: "/"`, `/home` start URL, `/` scope, standalone display                                                                                       |
| Icons             | PNGs exist at 192×192, 512×512 and maskable 512×512; binary dimensions checked. SVG favicon and generated Apple icon retained                                                   |
| Shared document   | `src/app/root-document.tsx` supplies Apple metadata, `viewportFit: "cover"`, device-theme media colors and appearance bootstrap to both root layouts                            |
| Install detection | `src/lib/pwa/install-controller.ts` captures the one-use prompt at document lifetime, handles secure context, standalone mode, `appinstalled`, and prompt rejection             |
| Install entry     | Shared `PwaInstallCard` is available in Personal and Group settings; it hides when unavailable/installed and shows platform guidance                                           |
| Financial data    | Server-backed. No registered service worker, Cache Storage strategy, IndexedDB financial store, persistent write queue or background sync found                                 |
| Navigation/auth   | `AppShell` preserves allowlisted group return paths through login and temporarily retains invitation codes in session storage                                                   |
| Group requests    | `src/state/groups.ts`: no-store fetches, request generations/abort, in-memory retry identities; these are not a durable offline queue                                           |
| Preferences       | Appearance, sidebar collapse and three-day edited highlighting are device preferences; locale uses a cookie. These are distinct from financial persistence                      |
| Resume and cache  | Identity-scoped personal reads, foreground session verification, safe read refresh and private/no-store authenticated responses are implemented; no offline queue exists      |
| Checks            | Source changes were linted and the existing unit suite passed locally. Dedicated PWA lifecycle coverage and physical-device installed-mode validation remain outstanding     |

The prior build-blocked note is superseded by a successful local production
build during this review. A browser viewport preview is not evidence of native
installation, safe-area behavior on actual hardware, or production readiness.

## Findings and work order

### A. Install lifecycle and truthful UI — implemented; focused coverage remains

The shared head bootstrap preserves an install event that arrives before
hydration. The root runtime then captures events before Settings mounts. One
controller serves both ledgers, consumes each prompt once, handles standalone
and `appinstalled`, and recovers from native prompt rejection. Personal and
Group Settings share one honest, localized install card with iOS/iPadOS,
macOS Safari and general browser guidance. `install-requested` remains visible
until browser installation is observed. No automatic prompt or extra manifest
was introduced.

**Remaining:** add focused lifecycle/UI regression coverage and confirm native
prompt behavior on supported browser versions. Source inspection alone cannot
prove physical-device installation.

### B. Standalone shell across the updated product

The shared shell now applies safe-area insets to Personal and Group navigation
and bottom-action regions. Shared dialogs use the current visual viewport,
internal scrolling and focus management. The personal Add screen keeps its own
insets to avoid losing keyboard/home-indicator spacing. Verify the whole flow
table below under browser viewport emulation and then on supported devices.

Test these flows in both ledgers, with keyboard open/closed, portrait/landscape,
320/390/430px widths, tablet, desktop, expanded/collapsed rail, and both Cozy and
Vibrant in system/light/dark preferences:

| Flow introduced/changed | PWA acceptance requirement                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared navigation       | Same typography/spacing/collapse preference; group selector remains accessible; scrollable group mobile navigation exposes all sections and Split without clipping                                               |
| Month/date navigation   | Previous/next month and calendar day/month jump stay usable; selected range is retained through an ordinary refresh where existing state supports it                                                             |
| Transaction add/edit    | Keyboard cannot cover Save/Delete. No extra add/edit/discard confirmation; only deletion of more than five records or whole-group closure needs the extra safeguard. Owner correction reasons remain required    |
| Record order/time       | A newly created record is first within its day; quiet creation time is distinct from occurred-on date                                                                                                            |
| Category editing        | Name/icon/accent controls and separated bottom Delete are reachable; there is no category Archive action                                                                                                         |
| Category organization   | Up/down, drag/tap and two-level moves work on touch/keyboard. Populated level changes require “Move with category” or “Make uncategorized”; no extra save confirmation                                           |
| Split & Settle          | Defaults and parent/child overrides, date/week/month selection and compact non-default ratios remain usable. Split only calculates; it never rewrites originals. Repeated Split overwrites selected calculations |
| Edited split review     | Financial edits can queue review; users may include/exclude them. Excluded reviewed edits are not repeatedly prompted. Do not confuse edited highlighting with pending split review                              |
| Edited highlight        | Three days by default, optional per device; disabling it does not suppress split review status                                                                                                                   |
| Group Goals             | Shared goal editor, progress, round-up destination and collection work with independent group data                                                                                                               |
| Group Recurring         | Monthly/all/calendar, pause/edit/delete and linked occurrence completion work; completion creates one group original, with allocation left to explicit Split                                                     |
| Import/export           | Picker, download/share fallback and long import workspaces work without browser chrome; protect an active import and never cache CSV contents accidentally                                                       |
| Group settings          | Export stays in Import / Export; archive/reopen/leave are in the separated bottom management panel                                                                                                               |

**Exit:** no status-bar, home-indicator, keyboard or sticky-action overlap;
minimum 44px touch targets; no duplicate insets on the personal Add screen.

### C. Authentication, freshness and update behavior — partially implemented

- Keep stable manifest `id`, root scope and `/home` launch. Verify existing
  installations update without creating a second identity. Group deep links and
  invitation return paths stay same-origin/allowlisted, including Goals/Bills.
  Do not put invitation/session tokens or ledger data in manifest URLs.
- Test expired/revoked sessions, group access removed, owner transfer, final-member
  exit, archived groups, logout and account deletion in standalone mode. A late
  request or old tab must not repaint a different account/group.
- **Implemented:** visible resume, focus, reconnect and back/forward-cache return
  verify the current user before refreshing. Personal read-only views reload
  when no editor is active; Group uses its guarded resume refresh and preserves
  drafts. Group polling also stays in memory.
- Still verify membership/revision changes, old-tab behavior and stale-save
  conflict choices in browser regression and native runs. Do not silently
  replace editable budget, split or settings baselines.
- A failed online write must not look saved. Preserve the existing exact retry
  identity for group mutations, Split, repayments, recurring completion and
  round-ups; do not introduce automatic recalculation on reconnect.
- A normal deployment must not force reload an active editor/import. Verify
  an old open tab can recover from an asset/version mismatch without losing a
  submitted-but-unacknowledged action or replaying it twice.
- **Implemented:** authenticated HTML/RSC, API and financial CSV responses are
  marked `private, no-store`; static versioned assets retain framework caching.
  Verify deployed headers and back/forward-cache behavior separately. No service
  worker does not mean browser history or every in-memory snapshot is empty.
- Static manifest colors cannot use CSS variables. Choose a documented neutral
  splash baseline, then verify runtime browser chrome follows the resolved
  appearance preference rather than assuming device media queries cover an
  explicit user override. Static installed splash limitations need honest docs.

**Exit:** fresh, authorized financial state after resume; safe conflict/retry
handling; no automatic persistence claim when offline; no data crossing ledgers.

### D. Automated and native-platform release evidence — outstanding

Add focused tests, then run `npm run lint`, `npm run test`, `npm run build`:

- Manifest identity, scope/start URL, icon sizes/assets, and public/authenticated
  root metadata. Reuse actual assets; do not regenerate the logo unnecessarily.
- Hook/controller SSR, secure/unavailable, initial standalone, iOS fallback,
  event-before-Settings, remount/navigation, one-shot accepted/dismissed,
  rejection, installed/timer races, display-mode change and listener cleanup.
- Shared card in personal/group settings: correct action/instructions, busy/error
  recovery, hidden installed/unavailable, both locales and no “Coming soon”.
- Browser regressions for the flow table above, narrow screens, theme overrides,
  keyboard/safe-area emulation and unchanged confirmation boundaries.
- Network failure, duplicate retry, 401/403/409, revoked group membership, resume,
  logout, account switch and deploy-with-an-open-tab. Keep integration fixtures
  in disposable test databases; do not seed or reset retained financial data.

| Native platform                 | Evidence required before calling this release verified                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| iOS/iPadOS Safari, including 26 | Install through Share, Open as Web App enabled, real standalone launch, keyboard/notch/home indicator and login/deep-link behavior |
| Android Chrome                  | Native prompt when available or browser install fallback, icon/maskable crop, installed launch and back navigation                 |
| macOS Safari                    | Add to Dock, dedicated app window, session behavior and navigation                                                                 |
| Desktop Chrome/Edge             | Install, standalone launch, correct app identity/icon, responsive rail and download behavior                                       |
| Windows Chrome/Edge             | Start-menu/taskbar entry, standalone launch, auth/update behavior                                                                  |

Record browser/OS versions, origin, build SHA, checks and results in the next
implementation report. Do not mark unavailable hardware as tested. A native
install is optional UX, never a prerequisite for ordinary browser use.

Optional analytics are deferred: the current analytics event union has no PWA
events, and none are needed to complete installation. Any later instrumentation
must use the existing opt-in wrapper and omit financial data, raw user agents,
invitation codes and sensitive URLs.

## Offline workstream: preserve 023's direction, implement separately

Online-first remains the current behavior. Do not register a worker or cache
financial responses merely to make the app installable; service workers are not
a universal installation requirement. Before implementing the offline direction
from 023, specify and verify these contracts in a dedicated implementation slice:

1. **Storage/identity:** explicit user + ledger kind + group ID namespaces,
   schema/version migrations, quota/eviction handling, freshness timestamps,
   account-switch/logout/deletion cleanup, and an export/recovery policy for
   unsynchronized work. An IndexedDB copy is not automatically encrypted or
   protected by an HTTP-only session cookie.
2. **Offline launch/read:** a versioned public shell/offline fallback, exact
   allowlists for static assets and any deliberately stored snapshots. Never
   indiscriminately cache `/api/*`, authenticated HTML/RSC, auth, invites, CSVs
   or external capture credentials. Disclose cached coverage and stale totals.
3. **First write slice:** original transaction drafts before complex financial
   mutations. Persist client mutation ID, integer cents, date/creation time,
   category/parent reference, expected version and explicit split-review intent.
   Keep queued submission distinct from an unsaved editor and a server receipt.
   Mark pending totals separately. Never cross-apply Personal/Group categories.
4. **Reconciliation:** durable retries and receipts for both ledger APIs,
   explicit conflict review, category rename/merge/delete/remap, missing payer,
   revoked membership and archive handling. Do not silently turn a deleted
   category into another category or drop an unsynchronized record. Account and
   group changes must prevent queued writes from reaching the wrong ledger.
5. **Financial operations:** keep Split/recalculation, repayments/reversals,
   round-up sweeps, recurring completion and hierarchy/bulk mutations online in
   the first offline slice. Design each later queue contract independently.
   Reconnect must not run Split automatically or resurrect excluded review
   reminders. Recurring completion/round-ups must never double-count.
6. **UX/update policy:** offline/pending/error/conflict indicators and foreground
   reconnect retry, with background sync as an enhancement rather than an iOS
   guarantee. Export/recover unsent work before destructive local cleanup.
   Preserve the user's ordinary save/delete confirmation rules; conflict
   resolution is a separate necessary decision, not a generic extra Save prompt.
7. **Upgrade/money gates:** test worker/client/API version compatibility and
   keep mixed-currency/minor-unit work in 023 a separate prerequisite if queued
   payloads ever support more than today's integer-cent ledger model. Never
   silently convert or combine currencies to make offline totals work.

This offline phase may need server idempotency/schema changes and browser
storage migrations. The earlier “no migration needed” claim applies only to
installation work, not to a full offline financial system.

## Expected implementation areas

Updated: `manifest.ts`, `root-document.tsx`, the document-level install
controller/runtime, shared Personal/Group install card, `AppShell`, `GroupApp`,
safe-area wrappers and shared dialogs, appearance/locale, cache policy and
session-scoped readers. Remaining PWA work is focused lifecycle/regression
coverage and native browser/device verification. Financial correctness stays in
domain repositories; do not duplicate category, split or recurring rules in a
PWA-specific store.

## References checked on 2026-10-29

- [Next.js App Router PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
  — use the repository's pinned version as the implementation baseline.
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
  — distinguishes installation from service-worker/offline capability.
- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
  — limited availability; deferred prompt must be captured and user-triggered.
- [WebKit: Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
  — Home Screen “Open as Web App” behavior on iOS/iPadOS 26.
- [Apple: Safari web apps on Mac](https://support.apple.com/en-gb/104996)
  — Add to Dock installation and app window behavior.
