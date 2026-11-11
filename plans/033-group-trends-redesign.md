# Group Trends redesign

Scope: Group Trends on desktop and mobile. Personal report presentation, routes,
financial calculations and mobile navigation remain the reference contracts.

1. Extract the Group report source; audit full-period versus comparison cutoffs
   and lock down refunds, voids, payer/category filters and incomplete loading.
2. Add one responsive Group report: mode controls, four KPIs, a full-width chart,
   supporting insights and six-month focused Cash Flow. Reuse report engines and
   chart primitives; optional chart presentation props preserve Personal.
3. Compact the Group Trends mobile identity, add mobile selection dialogs and
   progressively disclosed detailed comparisons without losing analytical rows.
4. Exercise calculations, interactions, responsive/theme rendering and production
   compilation; document actual coverage and remaining physical-device checks.

Each slice is committed on develop after its relevant checks. No remote push is
part of this task. Upcoming work belongs here; implemented behavior is recorded
in docs/group-trends.md.
