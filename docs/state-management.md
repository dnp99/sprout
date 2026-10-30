# State management

Sprout's client state lives in a single [Zustand](https://github.com/pmndrs/zustand)
store. One store holds all shared UI + server-cache state and every action/thunk,
for both the mobile and web surfaces. It's organized under
`src/state/`:

- [`types.ts`](../src/state/types.ts) — `AppState`, `AppActions`, `AppStore`.
- [`initial.ts`](../src/state/initial.ts) — the fresh personal/UI `initialState()`.
- [`groups.ts`](../src/state/groups.ts) — isolated household cache, request guards,
  and group mutations, composed into the same store.
- [`store.tsx`](../src/state/store.tsx) — stable exports for `StoreProvider`,
  `useStore`, and store types.
- [`create-store.ts`](../src/state/create-store.ts) — store construction and personal thunks.
- [`personal-loader.ts`](../src/state/personal-loader.ts) — abortable, identity-scoped personal reads.
- [`provider.tsx`](../src/state/provider.tsx) — per-request provider, appearance effects, selectors.
- [`reconcile.ts`](../src/state/reconcile.ts) — pure summary/transaction cache merges.

## Shape

- **`AppState`** — the data: server payloads (`user`, `categories`,
  `transactions`, `summary`, `goals`, `recurring`), navigation (`mobileScreen`,
  `webView`, …), the add flow, filters, report selections (including the
  focused Cash Flow month), app-level modal flags (including direct desktop
  category creation), and the auth/onboarding `flowStep`.
- **`AppActions`** — synchronous setters and async thunks (`login`, `saveGoal`,
  `setTransactionCategory`, `refresh`, …). Thunks read the live snapshot with
  `get()` and write with `set()`; `set()` merges shallowly (Zustand default).
- `AppStore = AppState & AppActions`.

Adding an action is a **single edit** — add it to `AppActions` and to the store
creator. There is no separate context value object or `useMemo` deps array to
keep in sync.

## Provider + SSR

The store is created per-provider via a lazy `useState` initializer inside
`StoreProvider` (wrapped once in `app/layout.tsx`), so each server request gets a
fresh instance — no cross-request state bleed. `StoreProvider` also fires the
one-time `bootstrap()` auth check on mount (guarded against React strict-mode
double-invoke).

## Mutation reconciliation

The initial data load is intentionally two-phase: summary data paints the shell
first, then the potentially large transaction list streams into the store. A
successful transaction edit therefore reconciles its canonical PATCH response
into the working set immediately instead of waiting for that background list
request. When “apply to merchant” is selected, every currently loaded row with
the same normalized merchant receives the new category at once; the subsequent
server reload remains authoritative and catches any rows outside the loaded
window.

Personal reads share an abort signal and generation. A newer load, logout or
account change invalidates both phases, so a late transaction response cannot
replace a newer session's records. A revoked session clears both Personal and
Group financial state while preserving device preferences. On visible resume,
`useSessionResume` verifies the authenticated user before refreshing safe,
read-only views; active editing surfaces keep their draft baseline. Resume never
replays financial writes or recalculates Split. See [pwa.md](pwa.md) for the
online-first lifecycle and cache boundary.

## Consuming with selectors

Components subscribe to **just the slice they use** so an unrelated `set()`
doesn't re-render them (important given the 1,700–5,000-row transaction list).

```tsx
// One field — atomic selector:
const goals = useStore((s) => s.goals);

// Multiple fields — wrap in useShallow so a new object literal each render
// doesn't cause a re-render when the selected values are unchanged:
const { transactions, categories, set } = useStore(
  useShallow((s) => ({
    transactions: s.transactions,
    categories: s.categories,
    set: s.set,
  })),
);
```

Rules of thumb:

- **Always** select only what the component reads. Don't call `useStore()` with
  no selector (it re-renders on every change).
- Use `useShallow` (from `zustand/react/shallow`) for any selector that returns
  an object/array of multiple fields.
- Actions are stable references, so selecting them never triggers re-renders.

## Appearance preferences

`visualTheme` (Vibrant / Cozy) is independent of `themePref` and resolved `theme`
(System / Light / Dark). Shared preference helpers and the pre-paint script live
in `src/lib/appearance/`; `setVisualTheme` applies and persists only the palette.
See [appearance.md](appearance.md).

## Group financial context

Group route selection lives in URLs rather than replacing personal `webView`,
transactions, or budget state. A focused group slice holds `groupList`,
`groupData`, loading/error state, and request/mutation helpers. Responses are
scoped by request generation and signed-in identity. Context teardown/logout
abort stale reads and clear group caches. Network retries retain their original
mutation ID/revision; server conflicts retain form drafts for review. See
[groups.md](groups.md) for lifecycle and polling rules.
