import { describe, expect, it } from "vitest";
import type { GroupEntry } from "./dto";
import { parseLedgerFilters, searchLedger } from "./search";

const entry = (id: string, patch: Partial<GroupEntry> = {}) =>
  ({
    id,
    merchant: "Groceries",
    note: "",
    occurredOn: "2026-10-20",
    payerId: "member-a",
    voidedAt: null,
    ...patch,
  }) as GroupEntry;

describe("complete group ledger search", () => {
  it("finds a match beyond the first page before pagination and counts matches", () => {
    const entries = Array.from({ length: 65 }, (_, i) => entry(String(i).padStart(3, "0")));
    entries[0].merchant = "Older matching shop";
    expect(
      searchLedger(entries, "2026-10")
        .slice(0, 50)
        .map((e) => e.id),
    ).not.toContain("000");
    const matches = searchLedger(entries, "2026-10", { query: "MATCHING" });
    expect(matches.map((e) => e.id)).toEqual(["000"]);
  });
  it("combines dates, payer and merchant/note search without including voids", () => {
    const entries = [
      entry("a"),
      entry("b", { occurredOn: "2026-09-01", note: "weekly delivery" }),
      entry("c", { payerId: null, note: "weekly delivery" }),
      entry("d", { note: "weekly delivery", voidedAt: "2026-10-22" }),
    ];
    expect(searchLedger(entries, "2026-10", { query: "delivery", payer: "member-a" })).toEqual([]);
    expect(
      searchLedger(entries, "2026-10", {
        query: " delivery ",
        payer: "member-a",
        scope: "all",
      }).map((e) => e.id),
    ).toEqual(["b"]);
    expect(searchLedger(entries, "2026-10", { payer: "shared" }).map((e) => e.id)).toEqual(["c"]);
    expect(searchLedger(entries, "2026-10", { payer: "another-group-member" })).toEqual([]);
  });
  it("validates public search parameters and bounds query size", () => {
    expect(parseLedgerFilters(new URLSearchParams("q=shop&payer=shared&scope=all"))).toEqual({
      query: "shop",
      payer: "shared",
      scope: "all",
    });
    expect(() => parseLedgerFilters(new URLSearchParams({ q: "x".repeat(121) }))).toThrow();
    expect(() => parseLedgerFilters(new URLSearchParams("scope=invalid"))).toThrow();
    expect(() => parseLedgerFilters(new URLSearchParams("payer=invalid"))).toThrow();
  });
  it("validates exact date ranges and filters the full ledger before pagination", () => {
    const filters = parseLedgerFilters(
      new URLSearchParams("scope=all&from=2026-02-01&to=2026-02-28"),
    );
    const entries = [
      entry("before", { occurredOn: "2026-01-31" }),
      entry("first", { occurredOn: "2026-02-01" }),
      entry("last", { occurredOn: "2026-02-28" }),
      entry("after", { occurredOn: "2026-03-01" }),
    ];
    expect(searchLedger(entries, "2026-11", filters).map((row) => row.id)).toEqual([
      "last",
      "first",
    ]);
    expect(() => parseLedgerFilters(new URLSearchParams("from=2026-02-30"))).toThrow();
    expect(() =>
      parseLedgerFilters(new URLSearchParams("from=2026-03-01&to=2026-02-01")),
    ).toThrow();
  });
});

it("applies primary kind before paging and intersects query/payer filters", () => {
  const entries = [
    ...Array.from({ length: 65 }, (_, i) => entry(`expense-${i}`, { kind: "expense" })),
    entry("income", { kind: "income", payerId: null, merchant: "Salary" }),
    entry("refund", { kind: "refund", payerId: null, merchant: "Salary refund" }),
  ];
  const result = searchLedger(entries, "2026-10", {
    kind: "income",
    query: "salary",
    payer: "shared",
  });
  expect(result.slice(0, 50).map((e) => e.id)).toEqual(["income"]);
  expect(searchLedger(entries, "2026-10", { kind: "expense" })).toHaveLength(65);
  expect(parseLedgerFilters(new URLSearchParams("kind=income"))).toMatchObject({ kind: "income" });
  expect(() => parseLedgerFilters(new URLSearchParams("kind=invalid"))).toThrow();
});

it("intersects category, amount, refund and payer across the full ledger", () => {
  const source = Array.from({ length: 70 }, (_, i) =>
    entry(`row-${i}`, {
      kind: i === 0 ? "refund" : "expense",
      categoryId: "cat-a",
      amountCents: i === 0 ? 1250 : -5000,
    }),
  );
  const result = searchLedger(source, "2026-10", {
    kind: "refund",
    category: "cat-a",
    amountMin: 1000,
    amountMax: 2000,
    payer: "member-a",
  });
  expect(result.map((row) => row.id)).toEqual(["row-0"]);
  expect(searchLedger(source, "2026-10", { amountMax: 1250 })).toHaveLength(1);
  expect(searchLedger(source, "2026-10", { category: "another-group-category" })).toEqual([]);
});
it("supports uncategorized rows without introducing an excluded accounting flag", () => {
  const source = [
    entry("a", { kind: "income", categoryId: null }),
    entry("b", { kind: "expense", categoryId: "cat" }),
  ];
  expect(searchLedger(source, "2026-10", { kind: "uncategorized" }).map((row) => row.id)).toEqual([
    "a",
  ]);
  expect(() => parseLedgerFilters(new URLSearchParams("kind=excluded"))).toThrow();
});
it("searches category labels and sorts by the same labels on server and client", () => {
  const source = [
    entry("a", { merchant: "Maple Shop", categoryId: "cat-a", amountCents: -5000 }),
    entry("b", { merchant: "Cedar Shop", categoryId: "cat-b", payerId: null, amountCents: -500 }),
  ];
  const labels = {
    categories: [
      { id: "cat-a", name: "Travel" },
      { id: "cat-b", name: "Food" },
    ],
    members: [{ id: "member-a", name: "Alex" }],
  };
  expect(searchLedger(source, "2026-10", { query: "travel" }, labels).map((row) => row.id)).toEqual(
    ["a"],
  );
  expect(
    searchLedger(source, "2026-10", { sort: "category", direction: "asc" }, labels).map(
      (row) => row.id,
    ),
  ).toEqual(["b", "a"]);
  expect(
    searchLedger(source, "2026-10", { sort: "amount", direction: "desc" }, labels).map(
      (row) => row.id,
    ),
  ).toEqual(["b", "a"]);
  expect(
    searchLedger(source, "2026-10", { sort: "payer", direction: "asc" }, labels).map(
      (row) => row.id,
    ),
  ).toEqual(["b", "a"]);
});
it("bounds and round-trips new public filters, including zero-cent bounds", async () => {
  const { ledgerFilterParams } = await import("./search");
  const filters = {
    query: "shop",
    payer: "shared",
    scope: "all",
    kind: "refund",
    category: "00000000-0000-4000-8000-000000000001",
    amountMin: 0,
    amountMax: 5000,
    sort: "amount",
    direction: "desc",
  } as const;
  expect(parseLedgerFilters(ledgerFilterParams(filters))).toEqual(filters);
  for (const query of [
    "min=-1",
    "max=1.5",
    "max=2147483648",
    "sort=invalid",
    "direction=invalid",
    "category=invalid",
  ])
    expect(() => parseLedgerFilters(new URLSearchParams(query))).toThrow();
});
