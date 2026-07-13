# External capture API + channels

Log a transaction **without opening Sprout** — by texting a WhatsApp bot or
firing a Siri Shortcut. Both are thin adapters over one authenticated **ingest
API**: it takes a structured transaction or a line of natural language, resolves
the category with the same machinery CSV import uses, and writes a real
`transactions` row.

Design intent and history:
[`../plans/completed/008-external-capture-api-and-channels.md`](../plans/completed/008-external-capture-api-and-channels.md).
Schema: [`er-diagram.md`](er-diagram.md).

## Architecture

Pure/testable logic lives in [`../src/lib/ingest/`](../src/lib/ingest/) with
colocated tests; routes stay thin. Every capture flows through one write path:

```
text ──▶ resolveCapture ──▶ classify ──▶ resolveMerchantCategory ──▶ ingestTransaction ──▶ transactions
         (regex → Haiku)    (kind +      (cached rules → Haiku,       (idempotent on
                             exclude)     skipped if excluded)         external_id)
```

- **`resolveCapture`** ([`capture.ts`](../src/lib/ingest/capture.ts)) — a
  deterministic regex fast-path ([`parse.ts`](../src/lib/ingest/parse.ts)) for
  the common shapes (`"coffee 4.50"`, `"$12 lunch"`, `"got paid 3200"`), then a
  **Haiku fallback** ([`ai-parse.ts`](../src/lib/ingest/ai-parse.ts)) only when
  the regex finds no amount — Siri dictations spell numbers as words
  (`"McDonald's five dollars"` → −$5.00). Degrades to the regex with no
  `ANTHROPIC_API_KEY`.
- **`classify`** (reused from import) is the **single source of truth** for
  `kind` + `excludeFromBudget`, so an internal transfer or card payment isn't
  logged as spend. The parser only produces a **signed** `amountCents`.
- **`ingestTransaction`** ([`ingest.ts`](../src/lib/ingest/ingest.ts)) is
  **write-first + idempotent**: a retry with the same `external_id` returns the
  existing row instead of duplicating.

## Endpoints

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /api/ingest` | Bearer | Structured `{ merchant, amountCents, categoryId?, note?, occurredAt? }` |
| `POST /api/ingest/text` | Bearer | Natural language `{ text }` — parse → write |
| `POST /api/webhooks/whatsapp` | Twilio signature | Inbound WhatsApp (link / undo / edit / capture) |
| `POST /api/channels/whatsapp/link` | Cookie | Mint a one-time link code |
| `GET/POST /api/tokens`, `DELETE /api/tokens/[id]` | Cookie | Manage bearer tokens (Connected apps UI) |

Send an `Idempotency-Key` header (a UUID / Twilio `MessageSid`) — it becomes the
row's `external_id`, so retries are no-ops.

```sh
curl -X POST https://<host>/api/ingest/text \
  -H "Authorization: Bearer sprt_…" \
  -H "Content-Type: application/json" \
  -d '{"text":"coffee 4.50"}'
# → 201 { "transaction": { merchant:"Coffee", amountCents:-450, categoryName:"Dining out", … }, "confidence":0.9 }
```

## Auth

Cookie sessions can't be held by a Shortcut or Twilio, so machines authenticate
differently ([`auth.ts`](../src/lib/ingest/auth.ts), schema in
[`er-diagram.md`](er-diagram.md)):

- **Bearer tokens** (`api_tokens`) — the `sprt_…` token created in **Settings →
  Connected apps**. Stored as `sha256(token)` (never raw) + an 8-char display
  prefix; scoped `ingest` (create-only); revocable. Shown **once** on creation.
- **Channel identities** (`channel_identities`) — a **verified** WhatsApp phone →
  user binding. `last_ingest_id`/`last_ingest_at` point at the row a bare
  `U`/`E` reply acts on (so undo hits the right row).
- **Link codes** (`channel_link_codes`) — one-time `SPRT-XXXX` codes (15-min TTL)
  that establish the phone→user binding.

## Reconciliation with CSV import

A purchase captured by WhatsApp/Siri and *also* present in a later bank CSV
carries a different `external_id`, so exact dedupe misses it. Captures are tagged
`source in ('whatsapp','siri')`; at import,
[`findLikelyCaptureDuplicate`](../src/lib/import/reconcile.ts) skips a CSV row
that matches a prior capture (**same signed `amountCents`, `occurredAt` within
±4 days**), counted as `ImportSummary.reconciled`. See
[`csv-import.md`](csv-import.md).

---

## Channel A — Siri Shortcut

`$0`, native voice, no third party. Onboarding is per-user (install + paste a
token).

1. **Settings → Connected apps → Create** a token; copy it.
2. New Shortcut, actions in order:
   1. **Dictate Text**
   2. **Get Contents of URL** — `<host>/api/ingest/text`, **POST**, header
      `Authorization: Bearer sprt_…`, Request Body **JSON** with `text` = the
      **Dictated Text** variable.
   3. *(optional)* **Show Notification** → the result, to see the confirmation.
3. Name it "Log expense to Sprout" → "Hey Siri, log expense to Sprout".

There's no reply channel, so the Shortcut's own card is the review; low
`confidence` just means "check this" (the row is already written — write-first).

## Channel B — WhatsApp (Twilio)

Cross-platform, gives a reply channel for the review + undo. First pass uses the
**Twilio WhatsApp Sandbox** (no number rental / business verification).

**Setup**
1. Twilio Console → **Messaging → Try it out → Send a WhatsApp message →
   Sandbox settings**. Set **"When a message comes in"** to
   `<host>/api/webhooks/whatsapp`, method **POST**.
2. Env (`.env.local` / Vercel): `TWILIO_AUTH_TOKEN`, optional
   `TWILIO_WEBHOOK_URL` (force the exact signed URL — needed behind ngrok),
   `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_APP_URL`.

**Flow**
1. User joins the sandbox (`join <code>` to the sandbox number).
2. In **Connected apps → Connect WhatsApp**, gets a `SPRT-XXXX` code; texts
   `link SPRT-XXXX` → phone bound.
3. Texts `coffee 4.50` → write-first, reply: `Logged −$4.50 · Coffee · Dining
   out ✅ — reply U to undo, E to edit.`
4. `U` deletes that row (via the `last_ingest_id` pointer) and clears the
   pointer (a second `U` is a no-op); `E` deep-links to edit.

Every request is **signature-verified** ([`twilio.ts`](../src/lib/ingest/twilio.ts))
against `TWILIO_AUTH_TOKEN` — unsigned/forged requests get `403` and no reply.

## Local dev gotchas (learned the hard way)

- **ngrok path** — the webhook is `/api/webhooks/whatsapp`; the Shortcut URL is
  `/api/ingest/text`. Missing `/api` → 404.
- **ngrok browser warning** — the free tier serves an interstitial to
  *browser-like* clients at its edge (invisible to the local inspector). If a
  client gets it instead of your API, add header `ngrok-skip-browser-warning:
  true`. (`node`/curl/Twilio bypass it automatically.)
- **`TWILIO_WEBHOOK_URL` must match byte-for-byte** what's configured in Twilio —
  the signature is computed over that exact string. ngrok's URL changes on
  restart, so update both.
- **Twilio Test vs Live token** — inbound webhooks are signed with the **Live**
  account auth token. Using the *Test* token → the signature never matches → 403
  with no reply. (Both are valid 32-hex, so this is easy to miss.)
- **Siri spells numbers as words** — `"five dollars"`, not `"$5"`. The regex
  needs digits, so voice relies on the Haiku fallback.

## Environment

```
ANTHROPIC_API_KEY          # optional — enables the NL Haiku fallback + categorization
TWILIO_AUTH_TOKEN          # WhatsApp webhook signature (Live account); without it, webhook 403s
TWILIO_WEBHOOK_URL         # optional — exact URL Twilio signs (behind a tunnel)
NEXT_PUBLIC_WHATSAPP_NUMBER # shown in the in-app link instructions
NEXT_PUBLIC_APP_URL        # deep-link base for WhatsApp "edit" replies
```

See [`../.env.example`](../.env.example).

## Security

- Bearer tokens hashed (sha256), shown once, `scope='ingest'`, revocable,
  `last_used_at` for audit.
- Twilio signature validation on the public webhook (fail closed).
- Phone binding is explicit (link code) — a random number can't write to an
  account.
