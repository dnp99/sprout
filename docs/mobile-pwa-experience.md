# Mobile PWA experience

Personal and Groups share a bounded mobile workspace below 1024px. The changes
apply to mobile browser tabs and installed PWAs. Desktop keeps its existing
sidebar, scroll regions and reset behavior. No palette, money calculation,
financial write path or offline capability changes.

## Audit findings

The former Personal min-height shell did not constrain its overflow region;
Groups combined an unbounded content region with fixed bottom tabs. Document
scroll and nested overflow therefore disagreed about scroll ownership. Mobile
had no equivalent of the desktop reset policy. Next's document scroll resets
could also compete with local navigation.

Personal transaction editors replaced their originating screen with Activity.
Transient pages/dialogs did not have a system Back boundary. Modal body locking
would not lock an internal page scroller, and restoring focus could move it.
Every visual viewport scroll also repeated computed-style/favicon work. Activity
mounted every matching transaction, making initial rendering grow with history.

## Layout and scroll ownership

`src/app/mobile-app.css` defines `.mobile-app-frame`: a fixed, flex-column frame
sized by the visual viewport, with `100dvh` fallback. Each ledger has exactly one
`[data-mobile-scroll]` page scroller. Context and page content scroll together;
`.mobile-bottom-nav` is a separate, non-scrolling flex sibling. Group's wrapper
uses `lg:contents` so the desktop flex layout stays intact.

Page screens should not add another vertical overflow region. Horizontal tables,
segments, menus and modal field regions retain their own purposeful scrolling.
Native page momentum and overscroll are retained; no global touchmove prevention
or global overscroll disabling is introduced. Dialogs lock both the body and the
page scrollers until the last nested dialog closes.

`useMobilePageScroll` caches offsets in refs with one passive listener and no
React updates on scroll. New top-level destinations start at zero. Returning
from a detail restores its parent; browser history traversals restore a seen
screen. Refreshes, filters, keyboard geometry and appearance changes do not
trigger a reset. Pending restoration waits for the matching ledger data.

Opaque `__sproutScrollEntry` history identities distinguish revisited entries
from fresh navigation. Next's history state is preserved. This avoids depending
on popstate listener order: Next can render a route before later listeners run.
Offsets are session-memory UI state, not durable records. A full reload or
unmounting a ledger shell starts a fresh scroll session. If refreshed content
becomes shorter, browser clamping still applies.

## Navigation and Back

The existing five bottom tabs and Next routes remain. Internal navigation uses
client navigation with `scroll:false`; each mobile shell owns its scroll policy.
Transaction/category return origins are recorded in the existing Zustand store.
An editor launched from Home, search or a category returns to that origin and
keeps its active tab/background.

`useMobileBackLayer` and `mobile-history.ts` place same-URL UI layers above the
current route. System/browser Back dismisses the top dialog or transient page.
Nested dialogs close top-first; busy close guards remain authoritative. UI Close
consumes its history layer. Registration waits one animation frame to avoid
StrictMode phantom entries and close/open traversal races. New top-level route
navigation abandons transient metadata before pushing a path. History contains
only opaque IDs, never form values or financial drafts. Forward does not replay
a dismissed draft.

Mobile Settings sections push hash destinations. Both the visible Back control
and system Back return to the index; visited panels remain mounted to retain
drafts. Desktop keeps replace-state section selection and its existing rail.
Deep links without an in-app index entry use the visible Back fallback.

No custom swipe-back gesture or global horizontal gesture recognizer is added.
Screen entrance uses opacity only, avoiding transformed ancestors for fixed
menus/dialogs: 180ms for tabs, 200ms forward, 150ms back. Reduced motion disables
these animations. Existing modal animation and geometry are reused.

## Viewport, keyboard and visual details

`presentation.ts` coalesces viewport geometry updates separately from palette /
favicon work. Visual viewport resize/scroll updates height, top and bottom
inset variables without reading computed styles. Focus plus a viewport reduction
above 150px identifies an on-screen keyboard. Bottom tabs/FAB/pagination hide
while it is open. Pinch zoom stays browser-owned. Existing transaction dialogs
consume the same viewport height/top and retain their single field scroller.

Top/bottom and horizontal safe areas remain respected. FAB/pagination offsets
include measured tab height; page padding leaves the final row reachable. The
Split & Settle sticky review action sits inside the page above the tabs instead
of reserving the old fixed-tab offset. Financial controls and confirmations are
unchanged.

Record rows have a 64px minimum mobile height. Bottom tabs retain at least 44px
width/56px height and use intrinsic label minimums; long translations or enlarged
text can scroll sideways instead of overlapping. No font shrinking, new colors,
card-radius changes or palette-specific layout forks are introduced.

## Long lists

Personal Activity memoizes filtering/sorting and renders 60 rows initially.
`MobileRecordList` appends 60 near the end using IntersectionObserver rooted in
the page scroller. A localized Load more button remains available for keyboards
and browsers without the observer. A bounded cache retains only visible counts
for twelve scopes so returning to a long list can restore its height. Totals,
selection and bulk actions still operate on all matching records. This is
incremental rendering, not full virtualization: a fully expanded very large list
can still become expensive. Group retains its existing server pagination.

## Validation and platform limits

Automated coverage exercises scroll retention/reset/restoration, route commit
ordering, same-URL nested history, busy dialogs, StrictMode cleanup, viewport
coalescing, keyboard/zoom geometry, return origins, Settings Back and 1,000-row
incremental rendering. Existing financial tests remain part of the full suite.

Lint, standalone TypeScript checking and the production build pass. The full
suite passes with 771 tests (49 skipped); production CSS includes the bounded
shell, intrinsic tab widths, keyboard rules and reduced-motion animation scope.

Local Chrome responsive checks covered 320px, 390px and 430px widths, Personal tab
switching, browser Back scroll restoration, transaction editor dismissal, Home
Add dismissal, Settings panel Back, Group scrolling/stable tabs and the settlement
action offset, and Group Add/system Back at 430px. The desktop Group sidebar and
content were checked at the 1024px breakpoint. All six appearance/mode combinations were switched in the account
dialog. No financial records were created, edited or deleted for these checks.

Physical installed iOS/Android PWAs were unavailable. Real keyboard panning,
home-indicator insets, Android system Back and touch momentum/rubber-banding
still need device acceptance. Chrome emulation cannot establish those results.
Remaining device checklist: repeat tab/detail Back, long-list scrolling, nested
modals, keyboard focus/rotation, enlarged text, reduced motion and all six themes
in both ledgers. Installation does not imply offline financial writes.

## Changed file map

| Area | Files |
| --- | --- |
| Mobile shells and visual rules | `src/components/mobile/MobileApp.tsx`, `src/components/groups/GroupApp.tsx`, `GroupMobileNavigation.tsx`, `GroupEntryDialog.tsx`, `src/app/mobile-app.css`, `root-document.tsx`, `GroupSplitWorkspace.tsx` (mobile footer offset only) |
| Scroll, Back and modal boundaries | `src/hooks/useMobilePageScroll.ts`, `useMobileBackLayer.ts`, `useModalFocus.ts`, `src/lib/pwa/mobile-history.ts`, `presentation.ts`, `src/components/useRouteSync.ts` |
| Origin and list state | `src/state/{types,initial,create-store}.ts`, mobile `Activity.tsx`, `CategoryDetail.tsx`, `TransactionDetail.tsx`, `MobileRecordList.tsx` |
| Settings and localization | `src/components/settings/SettingsWorkspace.tsx`, four `src/messages/*.json` catalogs (Load more) |
| Regression coverage | Colocated scroll, history, presentation, list, origin and Settings tests |
| Documentation | This doc, PWA, design-system, mobile-transaction-layout, account-and-ledger-navigation docs and plan 031 |
