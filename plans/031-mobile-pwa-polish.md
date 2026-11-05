# Mobile PWA polish

Status: implemented locally. Physical installed-device acceptance remains open.
See [mobile PWA experience](../docs/mobile-pwa-experience.md). Mobile only; desktop geometry and behavior,
all palettes, existing accounting and online-only writes remain unchanged.

## Audit

- Personal's min-height shell, overflow:auto main and sticky tabs do not define
  a bounded viewport; Group's overflow:auto area is explicitly unbounded on
  phones with a fixed tab bar. The document owns scrolling in practice, while
  the reset hook only targets desktop. Browser and inner-scroll behavior differ.
- Personal transaction details replace their originating screen with Activity,
  and always return there. Other transient screens have no browser history entry.
- Group navigation asks Next to reset document scroll while desktop uses an
  explicit reset. Neither mobile shell owns a stable restoration policy.
- Group polling already supports background refresh and keeps the snapshot;
  preserve it. Personal refresh also retains data. Resets must depend on screen
  identity, not loaded data, theme changes, month/filter or viewport resize.
- PWA presentation performs computed-style and favicon work on every visual
  viewport scroll, mixing keyboard geometry with theme updates.
- Shared dialogs already have a keyboard-sized boundary and transaction forms
  have one scrollable field region. Body locking alone does not lock a bounded
  mobile scroller; focus restoration can also move the background.
- Personal Activity renders every matching row. Long lists need bounded initial
  rendering with incremental access, while retaining selection over all results.

## Implementation

1. One bounded mobile shell and one vertical page scroller per ledger. Account
   context scrolls with content; the bottom bar is a non-scrolling flex sibling.
   Ordinary page momentum/overscroll remains native; contain only modal/menus.
2. Shared page scroll cache: new destinations start at top; detail returns and
   browser Back restore position. Same-page refreshes retain position.
3. Lightweight history layers for mobile dialogs and transient screens; retain
   existing Next routes for top-level navigation. No gesture navigation. Keep
   transaction origins and respect existing busy close guards.
4. Separate viewport geometry and theme work, coalesce with animation frames,
   handle keyboard/safe areas and pinch zoom without theme recalculation.
5. Mobile-only entrance transitions (150–200ms, reduced-motion aware), consistent
   page spacing, record readability and bottom/FAB clearance. Keep dialog
   geometry and theme palettes; make background locking and focus stable.
6. Regression tests for scroll/history/viewport behavior; lint, tests and build.
   Browser/device observations will be recorded honestly in the final docs.
