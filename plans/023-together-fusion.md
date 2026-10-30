# Together / Sprout fusion

User-approved direction, discussed 2026-10-26–27. This is planned behavior, not
a claim that all capabilities already exist. Keep existing data and UI style;
Detailed budget enhancements remain deferred; local UI fusion began on 2026-10-27. Do not deploy/push.

## Implemented local increment

- All active members may edit any shared record, with confirmation and a
  three-day highlight; original authorship and audit history remain intact.
- Daily overview/list omit debt and allocation amounts.
- Owner exit promotes the earliest remaining membership; final exit archives.
- Integration coverage for cross-author edits, void restrictions and exit.

## Remaining required implementation

- Separate original records from explicit date-filtered multi-select splitting.
  Income/expense supported; overwrite selected calculations, preserve other
  results/history, show a small calculated badge. Recalculation preserves real
  repayments. Cancel splitting independently. Mark financial edits stale.
- Real repayments support partial/overpayment, with author/recipient/owner
  reversal confirmation and audit. No actual bank transfers.
- Restore voided records; author/owner only. Shared originals editable by all.
- Refunds optionally link an original: linked refunds inherit category/currency
  and split, enforce cumulative cap, use receipt date; standalone reimbursements
  reduce category spend and are not income. Preserve repayments after refunds.
- One-level subcategories; bank import normally chooses parent. Unique child
  exact-name matches ignore case and surrounding whitespace; ambiguous matches
  stay at parent. Manual corrections and explicit reusable merchant rules.
- Retain Sprout budget as baseline, parent/child allocations without double
  counting; independent monthly/annual plans, annual fixed costs and optional
  monthly provisioning/savings goals to be designed later.
- Group invitation policy owner-only/all-members; one-use seven-day revocable
  tokens, configurable member limit, owner removal. Exit preserves shared data;
  user can remove only their own history/cache. Last exit closes invitations.
- Retain CSV mapping/dedupe/AI optional classification plus Together local OCR.
  Suspected cross-source duplicates require review. Transfer/card payment import
  setting: ask/record/skip; retained transfers excluded from daily totals.
  Group import attribution follows actual payer/recipient/participants, never
  importer; no automatic splitting. Auditable batch undo checks dependencies.
- Full offline IndexedDB writes, sync queue, idempotency, visible offline/pending
  state, local export, explicit conflict review, revoked-access handling; no
  silent loss on logout/cache removal. App-open reconnect retries.
- Cross-ledger search names/notes/amount only, source badges and ledger scope,
  member payer/recipient filter/avatar shortcut, chronological sorting. Offline
  scope disclosed; full-history online queries rather than current-page search.
- Preserve Sprout charts plus Together pie; weekly/monthly/year/custom ranges,
  daily group reports contain actual cash flows only. Local pending totals
  disclosed. CSV separates records/splits/repayments; PNG monthly/year reports
  have period confirmation and optional member/split information.
- Preserve recurring reconciliation, personal savings/goals, optional roundups,
  Together investment/emergency accounts, valuations and linked cash movements
  without double counting. No automatic money movement.
- English/Chinese/French UI; names/notes remain original, no external translation.
- Per-record explicit currency, ledger default, daily symbols and detail/export
  codes. Mixed currencies never sum/offset/convert. Budgets/goals/investments
  currency-scoped; linked refunds require same currency. Support minor-unit
  precision by currency while preserving integer money throughout.
- Sprout auth baseline plus email OTP; verified identity migration, never match
  display names. Current Cloudflare Together is primary migration source; compare
  old Sites changes first. Preserve legacy settled status without inventing
  repayment dates or amounts. Account deletion must match approved auto-transfer
  and archive rules, retaining anonymized shared history.

## Acceptance

Use local retained databases; never reseed/reset existing records. New schemas
require generated Drizzle migrations and ER documentation. Verify each increment
with relevant tests and browser checks; validate offline/currency/split workflows
end to end before describing this as a complete fused app.

## Local UI fusion

First pass: compare the Together hosted reference, align Cozy cream/sage tokens,
use a pill-shaped shared context switch, and match desktop brand icon to the
stroked UI system. Next: review personal/group overview composition and selective
pastel summary surfaces at desktop and mobile sizes before expanding the change.

Vibrant also distinguishes ledger modes through muted eucalyptus/personal and
warm orange/group navigation, using the same context token mechanism as Cozy.

## Cozy dark palette exploration

Preview only, pending user selection: explore airy mint, soft sage twilight,
and cool teal/moonlight dark palettes. Retain borderless color-block sections,
readable warm-white ink, and distinct green Personal / softened peach Group
navigation; avoid near-black with muddy orange/olive combinations. Compare
full desktop previews before changing production Cozy dark tokens. Reference
principles: Supabase semantic layered surfaces and separated accent ink/button
fills; Linear restrained chrome and balanced light/dark contrast.

Warm-dark preview revision: retain the accepted mint/teal greens, remove
red/purple brown undertones from Group navigation, and compare warm stone,
oatmeal grey and champagne-grey variants. Use neutral mid-dark surfaces as the
large-area foundation with limited apricot accents and off-white ink. Include
a grayscale comparison toggle to review surface hierarchy independently of hue.
These are visual proposals only; production Cozy dark tokens remain unchanged.

Decision: user chose the first warm-dark proposal, 暖杏石灰. Its palette is now
implemented in Cozy dark; the other variants remain exploratory. Keep existing
Sprout card geometry (the 24px tweak belonged to another variant).

Follow-up decision: set Cozy cards to the maximum preview radius, 24px, in both
light and dark modes. This supersedes the earlier keep-existing-geometry note.

Implemented UI rule: Personal green-dominant and Group orange-dominant desktop
overview surfaces, 65:35 area balance across both palettes and color modes.
See docs/context-color-balance.md for the neutral-surface exclusions and roles.

Cozy screenshot refinement: relaxed the numeric ratio into a warm/cool family
direction, interleaved pastel colors, and varied desktop card rows. Vibrant is
unchanged. No new financial metrics or mobile composition work in this pass.

Cozy palette refinement: warm cream canvas and cleaner Together-like light
pastels; warm-neutral dark canvas, preserving the approved dark card families.

Vibrant context refinement: green/blue Personal and orange/yellow Group across
content actions, selection fills, overview panels and canvas in both color modes.
Cozy unchanged. Supersedes the earlier mixed green/orange Vibrant content rule.

Preview pending selection: Vibrant three-layer surfaces (deepest navigation,
mid-depth canvas, palest green/blue or orange/yellow cards). Compare soft,
clear and deeper sidebar contrast in Personal and Group, with a grayscale
check. No production palette changes until a direction is chosen.

Selected: second Vibrant hierarchy preview (清晰层次), applied locally with
slightly darker, softly tinted cards to reduce the near-white glare.

## PWA planning reconciliation — 2026-10-29

[Plan 016](016-installable-online-first-pwa.md) now audits the implemented
installation foundation against both ledgers and the latest category, explicit
split/review, edited-highlight, navigation and shared Goals/Recurring changes.
Its online-first phase does not implement the offline queue described above.
The offline direction remains planned, with storage isolation, receipt/retry,
conflict, category remapping and unsent-work recovery contracts before rollout.
Do not describe installation or the in-memory group retry map as offline support.
Current financial behavior is documented in [Split & Settle](../docs/split-and-settle.md),
[category management](../docs/category-management.md) and
[shared ledger features](../docs/shared-ledger-features.md); earlier pending
bullets in this direction document are not a substitute for that current-state
baseline. In particular, ordinary add/edit/discard confirmations have been
removed; the three-day edit highlight is optional, and split review is separate.
