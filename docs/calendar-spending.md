# Overview calendar spending labels

Personal and Group Overview share `CalendarDayCell` for both Week and Month.
Their adapters continue to supply existing domain-classified daily totals:
income, reimbursements, exclusions, dates and ledger permissions are unchanged.
Other calendar consumers retain their existing presentation.

## Typography and selection

Dates use a 14px semibold line and daily amounts use 12px semibold foreground ink
with tabular numerals. Empty/no-record days retain a quiet dash; a real day with
zero net spending retains a zero amount. Selected days keep the existing circular
date indicator and semantic selected surface. Spending intensity never overrides
selection or keyboard focus. Adjacent-month dates keep neutral surfaces and muted
but full-opacity labels, avoiding the old whole-cell 40% opacity.

Day cells have a 68px minimum height and consistent auto-sized rows. Exceptional
stacked labels can grow naturally; no calendar/card height is fixed. The dense
seven-column grid necessarily gives day buttons less than 44px width at the
narrowest phone sizes; navigation controls retain their 44px targets and day
heights exceed 44px. Horizontal scrolling and overlapping targets are avoided.

## Display fitting and exact values

`CalendarAmount` measures non-interactive hidden candidates against its available
width. It prefers exact localized text, then exact text stacked only at currency
boundaries. Compact notation is used only when exact labels cannot fit. Rare
narrow-cell fallbacks use opt-in significant-digit precision; rounded small
amounts without a compact suffix show an approximation sign. Compact units can
wrap at their own boundary rather than truncating digits or shrinking fonts.

`formatMoneySegments` shares the existing formatter/currency/locale rules with
`formatMoney`. Its parts preserve sign, numeric value and currency ordering.
`compactSignificantDigits` is opt-in and leaves all existing formatting callers
unchanged. Full dates and exact amounts remain in each button's accessible label,
its tooltip and the selected-day summary; visual abbreviations never enter state
or financial calculations. Hidden probes have no accessible or scroll footprint.
ResizeObserver rechecks fitting after content/width changes.

## Intensity

`calendarSpendingIntensity` ranks unique positive daily spending totals into three
restrained levels. The visible Week supplies its full week; Month uses the selected
month's days, excluding adjacent-month context from its distribution. Zeros and
credits remain neutral. Equal amounts share a level and an all-equal period uses
the lowest level. Ordinal ranks prevent a single large outlier from washing out
all other days, without imposing currency-specific monetary thresholds.

Levels blend the existing semantic selected-soft surface with the card surface.
Adjacent-month context does not acquire stronger intensity. Amount text remains
the primary information, so spending magnitude never relies on color alone.

## Verification

Lint, standalone TypeScript, production build and the full suite passed: 919 tests,
50 skipped. Regression tests cover intensity ranking/outliers, zero versus no
activity, exact/compact formatting, safe localized unit breaks, resize fitting and
exact accessible labels. Production-CSS Chrome fixtures passed 192 standard
calendar cases and 224 final localized edge cases across both ledgers, Week/Month,
320–1440px, English/French/Simplified/Traditional Chinese and all theme/mode
combinations in the standard matrix. Labels remained at least 12px, without
horizontal overflow or ellipsized digits. Twelve separate sidebar cases verified
Vibrant active text/icons match the context-switch token while other palettes
retain their existing ink. Fixtures use fictional data; physical-device and
assistive-technology checks were not performed.
