# Phone bottom navigation

Below 768px, Personal and Group share the phone rules in
`src/app/mobile-navigation.css`, layered over the shared Navigation primitive.
The 768–1023px tablet bottom bar and desktop rail retain their existing layout.
All five destinations retain routes, accessible names, busy guards and active
mapping (including Goals under Budget). Only the visible phone budget label uses
the localized `nav.budgetsMobile` label; tablet keeps Budget & goals.

The bar's content is normally 68px (60px minimum items and 4px vertical padding).
It can grow with text settings. Each icon has an equal 48×28px pill containing a
22px icon, with primary/on-primary active colors. Labels use the shared label
font role, muted idle ink and foreground semibold active ink. Labels remain
unbroken; intrinsic column widths fit English at 320px while enlarged text and
long translations can scroll the track instead of clipping. Keyboard focus
remains on the complete target, whose minimum dimensions exceed 44×44px.
Color transitions last 150ms only when reduced motion is not requested.

Personal's wrapper applies the bottom safe-area inset once; Group's nav combines
its 4px content padding with that inset once. ResizeObserver measures the actual
navigation, pager and Add dock through `useMobileNavHeight`. The navigation
measurement already includes the safe area, so floating offsets never add it a
second time. Add is 16px above navigation, or above the pager when present.
Scroller clearance reserves measured pager + Add height and two 16px gaps, so
the final transaction and its menu can scroll above the floating controls.
Measured properties are removed when their element unmounts. Keyboard hiding and
visual viewport offsets retain the existing mobile workspace behavior.

The phone Add button uses primary/on-primary tokens in all three palettes and
both modes. Navigation and action colors contain no screenshot-specific values.
Installed iOS/Android safe-area and home-indicator behavior requires device
acceptance; responsive browser checks cannot certify OS PWA behavior.

## Verification

Lint, the production webpack build (including TypeScript), and the full unit
suite pass: 830 passing tests and 50 environment/integration skips. A headless
Chrome fixture using the app's processed styles checked 960 combinations:
Personal/Group, all five active destinations, six palette/mode combinations,
320/375/390/430px widths, simulated 0/34px bottom insets, and with/without
pagination. It checked single-line English labels, no navigation overflow,
44px targets, equal pill/icon sizes, a 16px Add gap and final-record clearance.
Tablet/desktop geometry matched the previous styles at 768/1023/1280px.
These fixture checks do not establish live-page routing, physical PWA behavior,
screen-reader behavior or actual iOS/Android safe-area values.
