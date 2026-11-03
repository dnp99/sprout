# AGENT.md

Standing rules for any agent (human or AI) working in this repository.

## Documentation Rule (Mandatory)

For this repository, **everything must be documented.**

### Required after each code update

1. If the change introduces or alters a concept, schema, flow, or convention,
   add or update the relevant doc under [`docs/`](docs/). Keep
   [`docs/er-diagram.md`](docs/er-diagram.md) in sync with `src/db/schema.ts`.
2. Comment non-obvious logic (the "why", not the "what"), matching the
   surrounding comment density.
3. Keep `README.md` and `CLAUDE.md` accurate when workflows or structure change.

### Scope

- Applies to app code, config, docs, and infrastructure.
- Applies to all future updates in this project.

## Fictional Example Data (Mandatory)

Use fictional names and sample data in code, tests, seed data, docs and plans.
Never copy personal names, personal checkout paths or private group names from
screenshots or live accounts into examples. Prefer names such as Alex and Taylor,
group names such as Maple House, reserved example email domains, and portable
paths such as `~/projects/sprout`. Functional account identifiers (for example,
GitHub ownership rules) must remain valid rather than being replaced with fake
accounts. This applies to repository examples, not names entered by app users.

## Branch Workflow Rule (Mandatory)

For this repository, work directly on **`develop`**. Never create a feature
branch for new work, and never commit directly on `main`.

### Required branch process before implementing changes

1. Switch to `develop`: `git switch develop`
2. Pull the latest `develop`: `git pull --ff-only origin develop`
3. Do all changes and commits directly on `develop`.
4. If `develop` has unrelated uncommitted work, preserve it and do not create a
   branch as a workaround; ask the user before taking an action that would
   overwrite or conflict with it.

### Recovery if a commit is made on `main`

1. Cherry-pick the commit onto `develop`.
2. Reset local `main` back to `origin/main`.
3. Continue work on `develop`.

## Theme-Aware Colour and CSS Rule (Mandatory)

All colour and CSS changes must respect the active theme and light/dark mode.

1. Use existing semantic CSS variables and their Tailwind classes for surfaces,
   text, borders, icons, overlays, loading states and interaction states. Define
   new shared colour roles centrally when needed; never hard-code theme colours
   in components. User-defined category accent colours remain the exception.
2. Shared components must work in Cozy, Elegant and Vibrant, in light and dark
   modes, on desktop, mobile and PWA, in both Personal and Groups. Portaled UI
   must retain the correct theme/context tokens. Scope intentional theme-specific
   changes explicitly so other themes remain unchanged.
3. Do not assume Tailwind opacity modifiers work with plain CSS-variable colours
   such as `card: "var(--card)"`. For translucent surfaces, use a compatible
   semantic token or explicit CSS such as
   `background: color-mix(in srgb, var(--card) 82%, transparent)`.
   Verify that the production build actually emits the required CSS; a class
   name in JSX or a passing DOM test alone does not prove a style is applied.
4. Check contrast and hover, focus, selected, loading and disabled states across
   the affected themes/modes. Preserve theme identity, existing geometry and
   responsive behaviour unless the user explicitly requests a change. Report
   any visual/device checks that could not be performed.

## Site-Wide Typography Rule (Mandatory)

- Geist is the only interface typeface. Typography roles live centrally in
  `src/app/typography.css`, independently of colour themes. Reuse `text-control`,
  `text-body`, `text-label` and `text-meta` for new UI instead of inventing local
  input/placeholder font sizes. Existing page-title and money-display roles may
  retain their deliberate size hierarchy.
- Inputs, textareas, native selects and themed select triggers use the shared
  control size: 14px for fine-pointer devices and at least 16px when a coarse
  pointer is available. Do not use viewport width as a proxy for touch input;
  a narrow laptop pane must not unexpectedly enlarge its controls. Never
  disable browser zoom or shrink text with transforms to bypass touch sizing.
- Placeholder text inherits the input's family, size, weight, line height and
  letter spacing. Only its semantic muted colour may differ. Never add a
  separate placeholder size, weight or scale.
- Font roles, weights and line spacing must remain identical across Cozy,
  Elegant and Vibrant and their light/dark modes. Preserve 44px mobile targets;
  smaller text does not justify smaller hit areas. Check empty, filled,
  focused and disabled controls, narrow fine-pointer windows and actual touch
  devices. Confirm emitted production CSS, and report unavailable device checks.

## UI Scope and Appearance / Ledger Parity (Mandatory)

- Current UI work targets mobile. Keep desktop unchanged for changes that only
  improve browsing or interaction convenience.
- Before changing design logic or concrete functionality, ask whether the change
  should also apply to desktop.
- Apply every non-color button and interface change to both Cozy and Vibrant,
  keeping layout, controls, and interactions consistent across these appearances.
  Preserve each appearance's own color tokens.
- Preserve existing card/container corner radii and button shapes in each
  appearance. Both mobile and desktop Cozy and Vibrant must share container dimensions, font
  sizes, line spacing and content density; appearance switching must preserve
  the same content and controls on every page.
- The current Personal/Group control-alignment work applies to both mobile and
  desktop. Identical functions must share action names, dimensions and placement,
  including dropdowns and dialogs. Preserve existing corner radii and border
  treatments. Keep ledger-specific functions in logical secondary areas for
  later review, without changing their permissions or accounting behavior.

- Desktop account controls use the bottom Account menu (no avatar, name or
  greeting in the rail), including a separated Log out action. Mobile account
  identity/security/appearance remain reached through the avatar above the
  ledger context switch. Ledger Settings stays separate (far-right mobile tab).
  Budget and Goals share a navigation slot but retain separate pages and data.
  Home keeps a persistent floating record action. Desktop Transactions uses a
  toolbar Add transaction action so its totals remain unobstructed; mobile
  Transactions retains its floating action. Do not restore an extra add button
  inside the calendar agenda.

- Mobile dark mode must match the corresponding desktop appearance and ledger
  palette. Reuse the same dark tokens, surfaces, text contrast and highlights;
  only responsive layout and interaction sizing differ. Do not introduce a
  separate mobile dark palette.

- Outside single-record detail/edit views, use compact accessible pencil/trash
  actions for Edit/Delete. Keep explicit labels in individual editors and
  destructive confirmations. UI text is non-selectable; editable form text
  retains selection/copy/paste. Both ledgers share the two-level category
  organizer for multiple children, drag ordering and attaching/detaching.

## Money Handling Rule (Mandatory)

Sprout deals with money; correctness matters.

1. Store and compute all monetary values as **signed integer cents** (negative =
   expense, positive = income) — never floats.
2. Convert to a display string **only** at the view boundary, via
   `formatMoney()` in `src/lib/format.ts`. Never inline `amount / 100` math or
   ad-hoc currency strings in components.
3. Derived totals (category spent, budget summary) are computed from cents and
   rounded only when formatting.
4. Validate amounts server-side (`src/lib/transactions/validation.ts`) before
   they reach the database.

## Code Hygiene Rule (Mandatory)

Keep files small and logic DRY.

1. When a file grows past **~500 lines** (or is clearly doing too much before
   then), refactor it: split large components into smaller ones, extract a hook,
   or move logic into `src/lib`. Prefer many focused files over one big file.
2. **Always extract common logic** into a shared helper, hook, or component
   instead of duplicating it — the moment you'd write the same block twice.
3. Keep helpers pure and testable (colocated `*.test.ts` where practical).

## Push Permission Rule (Mandatory)

**Never `git push` without the user's explicit permission.** Commit locally in
small, logical slices freely, but pushing to a remote (or creating/updating a PR)
is always a separate step the user must approve in that message. Never
force-push on their behalf.

## Verification Rule (Mandatory)

Once a push is approved, run and pass first: `npm run lint`, `npm run test`,
`npm run build`. Never push red.
