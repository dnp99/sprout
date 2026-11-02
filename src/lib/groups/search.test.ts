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
