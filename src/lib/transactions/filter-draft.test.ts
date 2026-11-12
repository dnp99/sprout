import { describe, expect, it } from "vitest";
import { emptyFilterDraft, filterAmount, resetFilterDraft, validFilterDraft } from "./filter-draft";
import { transactionFilterChips } from "@/components/shared/TransactionFilterChips";

describe("shared filter drafts", () => {
  it("parses cents precisely, including zero and localized decimals", () => {
    expect(filterAmount("0")).toBe(0);
    expect(filterAmount("12.50")).toBe(1250);
    expect(filterAmount("12,50", "fr-CA")).toBe(1250);
    expect(filterAmount("")).toBeNull();
    for (const raw of ["-1", "1.001", "1e2", "Infinity", "1abc", "1,234", "999999999999999999999"])
      expect(filterAmount(raw)).toBeNull();
  });
  it("blocks inverted ranges and allows empty or one-sided bounds", () => {
    expect(validFilterDraft({ ...emptyFilterDraft, min: "20", max: "10" }, "en-CA")).toBe(false);
    expect(validFilterDraft({ ...emptyFilterDraft, min: "20", max: "20" }, "en-CA")).toBe(true);
    expect(validFilterDraft({ ...emptyFilterDraft, max: "10" }, "en-CA")).toBe(true);
    expect(
      validFilterDraft({ ...emptyFilterDraft, from: "2026-10-02", to: "2026-10-01" }, "en-CA"),
    ).toBe(false);
  });
  it("creates independent resets and chips remove only their applied constraint", () => {
    const personal = { ...emptyFilterDraft, categories: ["housing"], min: "0" };
    const group = { ...emptyFilterDraft, categories: ["food"], payer: "member-a" };
    const results: (typeof personal)[] = [];
    const chips = transactionFilterChips(
      personal,
      {
        categories: [{ value: "housing", label: "Housing" }],
        sorts: [],
        quick: [],
        month: "2026-10",
      },
      {
        category: "Category",
        min: "Minimum",
        max: "Maximum",
        payer: "Paid by",
        date: "Dates",
        sort: "Sort",
        business: "Business",
        source: "Source",
      },
      (next) => results.push(next),
    );
    expect(chips.map((chip) => chip.id)).toEqual(["category:housing", "min"]);
    chips[0].onClear();
    expect(results[0]).toMatchObject({ categories: [], min: "0" });
    expect(group).toMatchObject({ categories: ["food"], payer: "member-a" });
    const reset = resetFilterDraft();
    reset.categories.push("other");
    expect(resetFilterDraft().categories).toEqual([]);
    expect(personal.categories).toEqual(["housing"]);
  });
});
