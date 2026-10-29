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
});
