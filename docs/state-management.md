# State management

Sprout's client state lives in a single [Zustand](https://github.com/pmndrs/zustand)
store. One store holds all shared UI + server-cache state and every action/thunk,
for both the mobile and web surfaces. It's split across three files under
`src/state/`:

- [`types.ts`](../src/state/types.ts) — `AppState`, `AppActions`, `AppStore`.
- [`initial.ts`](../src/state/initial.ts) — the fresh `initialState()` + `BUDGET_STEP`.
- [`store.tsx`](../src/state/store.tsx) — the store creator (thunks), `StoreProvider`,
  and the `useStore` hook. Re-exports `BUDGET_STEP` and the store types.

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
