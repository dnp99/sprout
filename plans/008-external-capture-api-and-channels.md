# 008 — External capture API + channels (WhatsApp, Siri Shortcut)

**Status:** Draft · **Created:** 2026-07-09 · **Revised after review 2026-07-09**
(write-first + undo, import reconciliation, extended create contract; then
correlated-undo pointer + parser/classify single-source-of-truth for `kind`)

## Outcome

Let a user log a transaction **without opening Sprout** — by texting a WhatsApp
bot or firing a Siri Shortcut — so daily capture stops being "open app → tap +
→ fill form." The heaviest source of friction isn't typing, it's the
context-switch into the app.

## Goal

Expose a thin, authenticated **ingest API** that accepts either a structured
transaction or a line of natural language ("spent 12 bucks on lunch"), resolves
the category with machinery we already have, and **writes a real `transactions`
row immediately**. v1 is **write-first**: the channel then shows a *review*
(with undo/edit), not a pre-write confirmation — see "Write-first + review"
below. Then put two capture **channels** on top of that one endpoint:

- **A. WhatsApp text** (via Twilio) — cross-platform, conversational, works for a
  mixed group of ~5 users. Primary channel.
- **B. Siri Shortcut** — iOS-only, native voice, zero third-party cost. Secondary.

Both are *adapters onto the same core*, so the core ships once and channels are
additive.

## Why this shape

Most of the pipeline already exists — this plan is mostly **auth + a parse step +
two adapters**:

- **Write path:** `POST /api/transactions` →
  [`validateCreateTransaction`](../src/lib/transactions/validation.ts) →
  [`transactions` repository](../src/lib/transactions/repository.ts). Ingest
  reuses it — but the shared contract must first be **extended**: today
  `CreateTransactionInput` / `createTransaction` accept only
  merchant/amount/category/note/method/occurredAt, so they can't carry the
  `kind`, `excludeFromBudget`, or `externalId` that ingest depends on for budget
  correctness + idempotency. Add those (optional, defaulting
  `expense`/`false`/`null`) so the in-app add path is untouched. See "Ingest
  endpoints" and "Idempotency & budget correctness".
- **Category resolution for free:** `merchant_rules` + the Haiku categorizer
  ([`ai-categorize.ts`](../src/lib/import/ai-categorize.ts),
  [`merchant-rules.ts`](../src/lib/import/merchant-rules.ts)) already turn a
  merchant string into a `categories.id`, cached one-time per merchant.
- **Dedupe/idempotency for free:** the partial unique index on
  `(user_id, external_id) WHERE external_id IS NOT NULL`
  ([`schema.ts`](../src/db/schema.ts)) makes a retried webhook a no-op if we key
  the row by the channel's message id.
- **Haiku is already wired** (structured output, `ANTHROPIC_API_KEY` **optional**)
  — the same pattern parses NL, and stays best-effort/degradable like import does.

The genuinely new surface is: **(1)** non-cookie auth for machines, **(2)** an NL
parse step, **(3)** the two channel adapters.

---

## Shared core (ship first)

### Model

Auth today is **cookie sessions only** ([`currentUser.ts`](../src/lib/auth/currentUser.ts)) —
Shortcuts and Twilio can't hold a cookie. Two small tables:

```
api_tokens                                  -- bearer auth for the Shortcut / any script
  id            uuid pk
  user_id       uuid -> users (cascade)
  name          text                        -- "My iPhone shortcut"
  token_hash    text unique                 -- sha256(token); we never store the token
  token_prefix  text                        -- first 8 chars, for display ("sprt_a1b2…")
  scope         text default 'ingest'       -- tight scope; not a full-API key
  last_used_at  timestamptz?
  revoked_at    timestamptz?
  created_at    timestamptz default now

channel_identities                          -- maps an external channel id to a Sprout user
  id              uuid pk
  user_id         uuid -> users (cascade)
  channel         text                       -- 'whatsapp'
  external_id     text                       -- E.164 phone, e.g. '+14155550123'
  verified_at     timestamptz?
  last_ingest_id  uuid -> transactions (set null)  -- the row a bare "U"/"E" reply acts on
  last_ingest_at  timestamptz?               -- when it was captured (bounds how far back "U" reaches)
  created_at      timestamptz default now
  unique (channel, external_id)

channel_link_codes                          -- one-time code to bind a phone to a user
  code          text pk                     -- short, shown in-app (e.g. "SPRT-4K9Q")
  user_id       uuid -> users (cascade)
  expires_at    timestamptz
  created_at    timestamptz default now
```

Follow the migration runbook in
[`docs/database-migrations.md`](../docs/database-migrations.md): edit
`schema.ts` → `npm run db:generate` (needs a live `DATABASE_URL_UNPOOLED`) →
`npm run db:migrate`. Keep [`docs/er-diagram.md`](../docs/er-diagram.md) in sync.

### Auth resolution — `src/lib/ingest/auth.ts`

- `resolveApiToken(header)` — parse `Authorization: Bearer <token>`, sha256 it,
  look up a non-revoked `api_tokens` row by `token_hash`, stamp `last_used_at`,
  return the `userId`. Mirrors `findUserByToken` but for tokens, not sessions.
- `resolveChannelUser(channel, externalId)` — look up a **verified**
  `channel_identities` row, return `userId` or null.
- Tokens are hashed with **sha256, not bcrypt** — we need an indexed exact-match
  lookup per request, and the token itself is high-entropy (unlike a password).

### NL parse — `src/lib/ingest/parse.ts` (pure + tested)

`parseCapture(text): CaptureDraft` →
`{ merchant, amountCents, occurredAt?, confidence, raw }`. The **sign of
`amountCents`** carries income-vs-expense; the parser deliberately returns **no
`kind`** — `classify` is the single source of truth for `kind` +
`excludeFromBudget` (next section), so exactly one place decides transaction type.

- **Deterministic fast-path first** (no API cost, always works): a regex for the
  common shapes — `"coffee 4.50"`, `"$12 lunch"`, `"12 bucks groceries"`,
  `"got paid 3200"` → magnitude + leftover-as-merchant + sign. **Sign only:**
  income words (`paid`, `salary`, `refund`, `deposit`) → positive `amountCents`,
  else negative. No `kind` field — `classify` derives type from that sign + the
  merchant. **Money stays integer cents** — parse to cents directly, never float
  (design-system rule 3).
- **Haiku fallback** for anything the regex can't confidently split, reusing the
  structured-output pattern from `ai-categorize.ts`. Returns low `confidence`
  when unsure so the channel can ask instead of guessing.
- **Degrade like import:** no `ANTHROPIC_API_KEY` or API error → fall back to the
  regex result (or a `needs_clarification` draft); never 500 on the model.
- Relative dates (`yesterday`, `on Tuesday`) → `occurredAt`; default now.

### Classify + category resolution — reuse, don't rebuild

**Classify first, exactly like import.** Before touching categories, run
[`classify`](../src/lib/import/classify.ts)`(null, amountCents, merchant)` (it
also reuses `isCardOrBillPayment`) to derive `kind` + `excludeFromBudget` — the
**only** place transaction type is decided, so the parser's job ends at a signed
`amountCents` (no precedence to negotiate between parser and classify). This is
what keeps an internal transfer or a "mastercard payment" from being logged as
normal spending — import does this ahead of categorization
([`run.ts`](../src/lib/import/run.ts)), and ingest must too. **When the row is
`excludeFromBudget`, skip category resolution entirely** (internal moves stay
uncategorized, same as import).

Otherwise resolve the category exactly like import's layers 2–3: normalize the
merchant (`normalizeMerchant`), hit cached `merchant_rules`, then the Haiku
categorizer, **writing the result back as a merchant rule** so it's one-time per
merchant. Extract the shared bit from import's `run.ts` into a reusable
`resolveMerchantCategory(userId, merchant)` if it isn't already callable in
isolation (code-hygiene rule 2 — no copy-paste).

### Ingest endpoints — thin, `src/app/api/ingest/*`

- `POST /api/ingest` — **structured** `{ merchant, amountCents, categoryId?,
  note?, method?, occurredAt? }`, bearer-authed. →
  `validateCreateTransaction` → `classify` → (category resolution unless excluded)
  → create with `kind`/`excludeFromBudget`/`externalId`. This is what a "typed
  fields" Shortcut posts. (Not literally "straight through" — it still classifies
  so a typed transfer isn't counted as spend.)
- `POST /api/ingest/text` — **natural language** `{ text }`, bearer-authed. →
  `parseCapture` → `classify` → (`resolveMerchantCategory` unless excluded) →
  create. Returns the **written** transaction (merchant, amount, category,
  confidence, id) so the caller can show a **review** card and offer undo/edit —
  the row already exists (write-first). This is the voice/dictation path.
- Both go through the `src/lib/http.ts` helpers and return the same shape.

### Write-first + review (not confirm-before-write)

v1 **always writes the row** on ingest; there is no draft state. The channel's
"confirmation" is really a **review of an already-written row**: it echoes what
was logged and offers **undo** (delete the row) and **edit**. Low `confidence`
only changes the review's emphasis (nudge the user to check it) — it never gates
the write. This keeps both channels consistent (WhatsApp has no way to hold a
draft anyway) and makes every misparse reversible. A **draft/confirm endpoint is
explicitly out of scope for v1** — a documented future option if pre-write
confirmation is ever wanted.

### Idempotency & budget correctness

- **Idempotency (retries):** accept an optional `Idempotency-Key` (Shortcut can
  send a UUID; WhatsApp uses Twilio's `MessageSid`). Persist it as `external_id`
  so the existing partial unique index turns a *retried webhook* into a no-op —
  the same mechanism CSV import relies on. (Manual in-app adds keep null
  `external_id`.) Note this only dedupes **exact** `external_id` matches — it does
  **not** catch the same purchase arriving later via CSV (see reconciliation).
- **Budget correctness:** `classify` (not the raw parse) sets `kind` +
  `excludeFromBudget` before the write, so transfers/card payments are excluded
  from safe-to-spend math exactly as imported ones are. The create contract must
  actually persist these fields (see "Why this shape").
- **Reconciliation with a later CSV import (v1, not punted).** A coffee captured
  by WhatsApp/Siri and *also* present in a later bank CSV carries a **different**
  `external_id` (channel msg-id vs CSV row-hash), so exact dedup won't catch it and
  it would double-count. Fix:
  - **Tag channel captures** with their origin (a `source`/`channel` marker on the
    row) so import can tell a captured row from a manual add.
  - Add a pure, unit-tested helper
    `findLikelyCaptureDuplicate(existingRows, csvRow, { windowDays })`: a CSV row
    is a duplicate of a prior channel capture when **sign matches, `amountCents`
    is exactly equal, and `occurredAt` is within ±N days** (default a small
    window, ~3–4 days, to absorb posted-vs-captured lag). Exact-cents keeps it
    conservative.
  - Run it in the import pipeline ([`run.ts`](../src/lib/import/run.ts) /
    `persist.ts`) **before insert**: when a CSV row matches a channel capture,
    **skip the CSV row** (the capture is the source of truth) and count it under a
    new `reconciled` tally in `ImportSummary` so the user sees what was merged.
  - Fuzzy *merchant-name* matching stays out of scope; sign+amount+date-window is
    the v1 rule (a later refinement can add merchant similarity).

---

## Channel A — WhatsApp (Twilio), primary

### Why WhatsApp for ~5 mixed users

Cross-platform (no iPhone requirement), already-installed, and gives a **reply
channel** for the review + undo — which matters because NL parsing *will*
occasionally misfire. Central setup (configure Twilio once) beats handing 5 people a Shortcut +
token each.

### First pass: **text-only, Twilio Sandbox**

- **Twilio WhatsApp Sandbox** — no Meta business verification, no dedicated number,
  no number rental. Each of the ~5 users joins once by texting the sandbox join
  code. Good enough for a known group.
- Webhook: `POST /api/webhooks/whatsapp` (Twilio posts `application/x-www-form-
  urlencoded`: `From`, `Body`, `MessageSid`).
  1. **Verify Twilio's `X-Twilio-Signature`** (HMAC over URL + params with the
     auth token) — reject anything unsigned. This endpoint is public.
  2. `resolveChannelUser('whatsapp', From)` → user, or a **link prompt** if the
     phone isn't bound yet.
  3. `parseCapture(Body)` → `classify` → resolve category (unless excluded) →
     **create** (idempotent on `MessageSid`). Write-first — the row now exists.
     **Stamp `channel_identities.last_ingest_id` + `last_ingest_at`** with the row
     just written, so a follow-up `U`/`E` reply knows exactly which row it means.
  4. **Reply** (TwiML) with the **review** of the written row: `"Logged $4.50 ·
     Blue Bottle · Dining out ✅  — reply E to edit, U to undo."`
- **Linking flow:** in-app Settings shows a code from `channel_link_codes`; the
  user texts `link SPRT-4K9Q`; the webhook binds `From` → that `user_id`,
  `verified_at = now`, and burns the code. Unknown senders get "Text `link
  <code>` from Sprout → Settings to connect."
- **Review actions (in v1, not optional) — correlated to a specific row.** A bare
  reply carries no thread, so "delete the last row for this phone" is brittle
  under multiple captures, retries, or out-of-order replies. Instead the webhook
  keys off the **`last_ingest_id` pointer** stamped in step 3: `U` deletes *that*
  row and then **clears the pointer** (a second `U` is a no-op), and `E`
  deep-links to edit that same row. The pointer only covers the **most recent**
  capture and only within a short window (`last_ingest_at`, e.g. a few minutes) —
  anything older is edited in-app, not by reply. Retries are idempotent on
  `MessageSid`, so they never move the pointer. (A row-specific action token in
  the reply is an equivalent alternative; the per-identity pointer is simpler for
  a text-only sandbox.) Because ingest is write-first, this makes a fat-fingered
  parse reversible — so it ships in v1, not "later."

### Cost (first pass)

Meta **service conversations** (user-initiated) are **free**; we never send
templates. Twilio adds ~**$0.005/message**. One capture = inbound + confirmation ≈
**$0.01**. For 5 users this is **~$5–20/month**, no number rental. Twilio trial
credit covers early testing.

### Later (not first pass)

- **Voice notes** — download the WhatsApp audio, speech-to-text (Whisper or
  similar), then the same `parseCapture`. Adds an STT bill + media handling.
- **Production sender** — graduate off the sandbox to a registered WhatsApp number
  (needs Meta business verification). Per-message economics are unchanged; it's a
  one-time verification hassle. Adapter code doesn't change.

---

## Channel B — Siri Shortcut, secondary

### Why secondary for a group

iOS-only (excludes any Android user in the group), onboarding is **per-user
manual** (install the shortcut *and* paste a personal token), and there's no reply
channel — the review is the Shortcut's own on-device card. But it's **$0**, native
voice via Siri, and needs no webhook/third party. Great when everyone's on iPhone,
or as a power-user add-on.

### Shape

- User generates a token in **Settings → Connected apps** (new): we show the raw
  token **once**, store only `token_hash` + `token_prefix`, and list/revoke
  existing tokens.
- The shipped Shortcut ("Log expense to Sprout"):
  1. Prompt / dictate text (Siri: "Hey Siri, log expense").
  2. `POST /api/ingest/text` with `Authorization: Bearer <token>` and an
     `Idempotency-Key` UUID.
  3. Show the returned **written** transaction as a **review card** (the row is
     already logged — write-first). The card offers **edit** (deep link) and
     **undo** — both act on the **returned row id**, so no server-side
     correlation is needed here (unlike WhatsApp's `last_ingest_id` pointer). Low
     `confidence` just emphasizes "check this" — it
     does not gate the write, since there's no reply channel to confirm through.
- Distribute via an iCloud Shortcut link + a one-paragraph setup note (generate
  token → paste into the shortcut's Text action).

### Cost

$0. No per-message fee, no number, no third party.

---

## Security

- **Twilio signature validation** on the WhatsApp webhook — it's a public
  endpoint; unsigned requests are rejected.
- **Tokens:** hashed (sha256), shown once, `scope='ingest'` (create-only — not a
  general API key), revocable, `last_used_at` for audit.
- **Rate-limit** ingest per user/token to bound abuse and runaway model spend.
- **Phone binding is explicit** (link code), so a random number texting the bot
  can't write to anyone's account.
- Log each ingest (channel, parsed result, confidence) for debugging misparses.

## New / touched files

```
src/db/schema.ts                         + api_tokens, channel_identities (incl. last_ingest_id/at undo pointer), channel_link_codes; + a source/channel marker on transactions
src/lib/transactions/validation.ts       extend CreateTransactionInput + validate kind / excludeFromBudget / externalId (optional, defaulted)
src/lib/transactions/repository.ts       persist kind / excludeFromBudget / externalId in createTransaction
src/lib/ingest/auth.ts                   resolveApiToken, resolveChannelUser
src/lib/ingest/parse.ts (+ .test)        parseCapture — regex fast-path + Haiku fallback
src/lib/ingest/resolve.ts                resolveMerchantCategory (extracted from import/run.ts)
src/lib/ingest/repository.ts             token + channel-identity + link-code CRUD
src/lib/import/classify.ts               reused by ingest (no change) to derive kind + excludeFromBudget
src/lib/import/reconcile.ts (+ .test)    findLikelyCaptureDuplicate — sign + exact amount + date-window match
src/lib/import/run.ts / persist.ts       skip CSV rows matching a channel capture; + ImportSummary.reconciled
src/app/api/ingest/route.ts              structured ingest (bearer) — validate → classify → resolve → create
src/app/api/ingest/text/route.ts         NL ingest (bearer) — parse → classify → resolve → create (write-first)
src/app/api/webhooks/whatsapp/route.ts   Twilio webhook (signature-verified)
src/components/settings/ConnectedApps.*  token create/revoke + WhatsApp link code (web + mobile)
docs/capture-api.md                      the standing doc (endpoints, auth, channels)
docs/er-diagram.md                       keep in sync with the 3 new tables
```

Keep files under the ~500-line ceiling; adapters stay thin, logic lives in
`src/lib/ingest/*` with colocated tests (code-hygiene rules).

## Sequencing

1. **Core** — the 3 tables + migration, `auth.ts`, `parse.ts` (+ tests),
   `resolve.ts`, and both `/api/ingest*` endpoints. Testable immediately with
   `curl` + a bearer token.
2. **Channel B (Shortcut)** — Settings token UI + the iCloud Shortcut. Smallest
   surface on top of the core; validates the endpoint end-to-end with native
   voice.
3. **Channel A (WhatsApp)** — Twilio sandbox webhook, `channel_identities` +
   link-code flow, review + undo replies. The primary channel for the group.
4. **Docs** — `docs/capture-api.md`, update `er-diagram.md`, flip this plan to
   Complete and move to `plans/completed/`.

Channels 2 and 3 are independent once the core exists — order can flip based on
whether the group is all-iPhone (do Shortcut first) or mixed (do WhatsApp first).

## Open questions

1. **Token model** — confirmed: dedicated `api_tokens` (cleaner scope/revoke)
   over reusing the long-lived session token.
2. **First channel** — depends on the group: all-iPhone → Shortcut first; mixed →
   WhatsApp first. (Leaning WhatsApp given ~5 mixed users.)
3. **Reconciliation with CSV import** — *resolved: reconcile at import in v1.* A
   captured coffee also present in a later bank CSV carries a different
   `external_id`, so exact dedup misses it. v1 skips the CSV row when it matches a
   prior channel capture by **sign + exact `amountCents` + `occurredAt` within ±N
   days** (`findLikelyCaptureDuplicate`), counted as `reconciled`. Fuzzy
   merchant-name matching is the later refinement — same idea flagged in the
   recurring-materialization note.
4. **Undo/edit** — *resolved: in v1.* Because ingest is write-first, `U` undo (+
   `E` edit) is the safety valve that makes a misparse reversible, so it ships in
   v1 on both channels. A **draft/confirm** two-step endpoint (true pre-write
   confirmation) is a documented future option, explicitly out of scope for v1.
```
