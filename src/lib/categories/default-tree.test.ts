import { describe, expect, it } from "vitest";
import { buildDefaultCategories, addDefaultCategories } from "./default-tree";
import { categoryIdsByLabel } from "./labels";
import { validateCategoryTree, validateGroupCategoryNames } from "@/lib/groups/category-tree";
import { resolvePresetCategoryId } from "@/lib/import/category-map";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EntitySymbol } from "@/components/ui/EntitySymbol";

const ids = () => {
  let next = 0;
  return () => `category-${next++}`;
};

describe("shared default category tree", () => {
  it("creates the confirmed two-level structure with independent ledger identities", () => {
    const rows = buildDefaultCategories(ids());
    expect(rows).toHaveLength(80);
    expect(rows.filter((row) => !row.parentId)).toHaveLength(20);
    expect(rows.every((row) => row.monthlyBudgetCents === 0)).toBe(true);
    const nodes = rows.map((row) => ({ ...row, archived: false }));
    expect(() => validateCategoryTree([], { nodes, merges: [] })).not.toThrow();
    const labels = categoryIdsByLabel(rows);
    expect(labels.has("groceries / food")).toBe(true);
    expect(labels.has("work & office / professional services")).toBe(false);
    expect(labels.has("service")).toBe(true);
    expect(labels.has("tickets")).toBe(false);
    expect(
      new Set([
        labels.get("car / tickets"),
        labels.get("fun / tickets"),
        labels.get("travel / tickets"),
      ]).size,
    ).toBe(3);
    expect(labels.get("transportation")).not.toBe(labels.get("travel / transportation"));
    const other = buildDefaultCategories(() => crypto.randomUUID());
    expect(other.map(({ id, parentId, ...row }) => row)).toEqual(
      rows.map(({ id, parentId, ...row }) => row),
    );
    expect(other.some((row) => rows.some((first) => first.id === row.id))).toBe(false);
  });

  it("previews an idempotent upgrade preserving custom categories, IDs, budgets and input", () => {
    const current = [
      {
        id: "old-home",
        name: "Bills & rent",
        emoji: "🏠",
        color: "#d97a54",
        parentId: null,
        monthlyBudgetCents: 120000,
      },
      {
        id: "custom",
        name: "Crafts",
        emoji: "🎨",
        color: "#c98a5a",
        parentId: null,
        monthlyBudgetCents: 2000,
      },
    ];
    const draft = { nodes: current, merges: [] };
    const upgraded = addDefaultCategories(draft, ids());
    expect(upgraded.nodes.find((row) => row.id === "old-home")).toMatchObject({
      name: "Housing",
      monthlyBudgetCents: 120000,
    });
    expect(upgraded.nodes.find((row) => row.id === "custom")).toEqual(current[1]);
    expect(draft.nodes[0].name).toBe("Bills & rent");
    expect(addDefaultCategories(upgraded, ids())).toEqual(upgraded);
    expect(() =>
      validateCategoryTree(
        current.map((row) => ({ ...row, archived: false })),
        upgraded,
      ),
    ).not.toThrow();
  });

  it("resolves preset categories in upgraded and legacy ledgers", () => {
    expect(resolvePresetCategoryId("bills", new Map([["bills & rent", "old"]]))).toBe("old");
    expect(
      resolvePresetCategoryId(
        "bills",
        new Map([
          ["housing", "new"],
          ["bills & rent", "old"],
        ]),
      ),
    ).toBe("new");
  });

  it("rejects duplicate siblings while permitting the confirmed repeated child labels", () => {
    const nodes = buildDefaultCategories(ids());
    const tickets = nodes.find((row) => row.name === "Tickets")!;
    expect(() =>
      validateCategoryTree([], { nodes: [...nodes, { ...tickets, id: "duplicate" }], merges: [] }),
    ).toThrow(/unique/);
  });

  it("gives fines, event tickets and cloud storage recognizable, distinct icons", () => {
    const nodes = buildDefaultCategories(ids());
    const labels = categoryIdsByLabel(nodes);
    const icon = (path: string) =>
      renderToStaticMarkup(
        createElement(EntitySymbol, {
          emoji: nodes.find((node) => node.id === labels.get(path))!.emoji,
        }),
      );
    expect(icon("car / tickets")).toContain("lucide-triangle-alert");
    expect(icon("fun / tickets")).toContain("lucide-ticket");
    expect(icon("apps & subs / cloud storage")).toContain("lucide-cloud");
  });

  it("rejects a parent deletion that would promote a duplicate Transportation root", () => {
    const rows = buildDefaultCategories(ids());
    const travel = rows.find((row) => row.name === "Travel")!;
    const promoted = rows
      .filter((row) => row.id !== travel.id)
      .map((row) => ({
        ...row,
        archived: false,
        parentId: row.parentId === travel.id ? null : row.parentId,
      }));
    expect(() => validateGroupCategoryNames(promoted)).toThrow(/unambiguous/);
  });

  it("replaces all six legacy defaults in canonical order and merges duplicate roots", () => {
    const legacy = ["Bills & rent", "Groceries", "Dining out", "Shopping", "Transport", "Fun"].map(
      (name, i) => ({
        id: `old-${i}`,
        name,
        emoji: "🏷️",
        color: "#c98a5a",
        parentId: null,
      }),
    );
    const current = [
      ...legacy,
      { ...legacy[0], id: "new-home", name: "Housing" },
      { ...legacy[0], id: "custom-child", name: "Custom maintenance", parentId: "old-0" },
    ];
    const upgraded = addDefaultCategories({ nodes: current, merges: [] }, ids());
    expect(
      upgraded.nodes
        .filter((node) => !node.parentId)
        .slice(0, 4)
        .map((node) => node.name),
    ).toEqual(["Housing", "Phone", "Wi-Fi", "Groceries"]);
    expect(
      upgraded.nodes.some((node) =>
        ["Bills & rent", "Dining out", "Transport"].includes(node.name),
      ),
    ).toBe(false);
    expect(upgraded.merges).toContainEqual({ sourceId: "old-0", targetId: "new-home" });
    expect(upgraded.nodes.find((node) => node.id === "custom-child")?.parentId).toBe("new-home");
    expect(upgraded.recordChoices).toContainEqual({ categoryId: "custom-child", action: "keep" });
    expect(upgraded.nodes.find((node) => node.name === "Groceries")?.id).toBe("old-1");
    expect(() =>
      validateCategoryTree(
        current.map((node) => ({ ...node, archived: false })),
        upgraded,
      ),
    ).not.toThrow();
  });
});
