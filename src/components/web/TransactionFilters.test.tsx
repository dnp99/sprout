import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { StoreApi, UseBoundStore } from "zustand";
import type { AppStore } from "@/state/types";
import { TransactionFilters } from "./TransactionFilters";
import { GroupSearch } from "@/components/groups/GroupSearch";
import type { GroupLedgerFilters } from "@/lib/groups/search";
import type { GroupSnapshot } from "@/lib/groups/dto";

const capture = vi.hoisted(() => ({
  store: undefined as unknown as UseBoundStore<StoreApi<AppStore>>,
}));
vi.mock("@/state/store", async () => {
  const { create } = await import("zustand");
  const { initialState } = await import("@/state/initial");
  capture.store = create<AppStore>((set) => ({ ...initialState(), set }) as AppStore);
  return { useStore: capture.store };
});
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("./SavedViews", () => ({ SavedViews: () => null }));
vi.mock("@/hooks/useDesktop", () => ({ useDesktop: () => true }));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
const data = {
  members: [{ id: "alex", name: "Alex" }],
  categories: [],
} as unknown as GroupSnapshot;
const groupChange = vi.fn();
function Harness() {
  const [filters, setFilters] = useState<GroupLedgerFilters>({
    payer: "alex",
    kind: "expense",
    sort: "payer",
    direction: "desc",
  });
  return (
    <>
      <section data-test="personal">
        <TransactionFilters />
      </section>
      <section data-test="group">
        <GroupSearch
          data={data}
          month="2026-10"
          filters={filters}
          disabled={false}
          onChange={(next) => {
            groupChange(next);
            setFilters(next);
          }}
        />
      </section>
    </>
  );
}
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  groupChange.mockClear();
  vi.unstubAllGlobals();
});
it("synchronizes Personal category/sort and preserves Group payer and primary kind independently", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  capture.store.setState({
    categories: [
      { id: "housing", name: "Housing", emoji: "house", parentId: null },
    ] as AppStore["categories"],
    txnCategory: "housing",
    webTxnCategoryIds: ["housing"],
    webSortKey: "merchant",
    webSortDir: "asc",
    webTxnType: "income",
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
  const open = (ledger: string) =>
    act(() =>
      container
        .querySelector<HTMLButtonElement>(`[data-test="${ledger}"] [aria-haspopup="dialog"]`)!
        .click(),
    );
  const dialog = () => document.querySelector('[role="dialog"]')!;
  open("personal");
  expect(dialog().querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
  expect(dialog().querySelector<HTMLSelectElement>('select[aria-label="sortLabel"]')!.value).toBe(
    "merchant:asc",
  );
  expect(dialog().querySelector('select[aria-label="paidBy"]')).toBeNull();
  act(() => dialog().querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
  act(() => dialog().querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
  expect(capture.store.getState()).toMatchObject({
    txnCategory: "all",
    webTxnCategoryIds: [],
    webSortKey: "merchant",
    webSortDir: "asc",
    webTxnType: "income",
  });
  expect(groupChange).not.toHaveBeenCalled();
  open("group");
  expect(dialog().querySelector<HTMLSelectElement>('select[aria-label="paidBy"]')!.value).toBe(
    "alex",
  );
  expect(dialog().querySelector<HTMLSelectElement>('select[aria-label="sortLabel"]')!.value).toBe(
    "payer:desc",
  );
  act(() => dialog().querySelector<HTMLInputElement>('[role="switch"]')!.click());
  act(() => dialog().querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
  expect(groupChange).toHaveBeenLastCalledWith(
    expect.objectContaining({
      payer: "alex",
      kind: "expense",
      quick: "refund",
      sort: "payer",
      direction: "desc",
    }),
  );
  expect(capture.store.getState()).toMatchObject({
    webTxnQuickType: "all",
    webTxnType: "income",
    webSortKey: "merchant",
  });
});
