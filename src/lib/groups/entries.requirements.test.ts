import { beforeEach, expect, it, vi } from "vitest";
import { groupCategories } from "@/db/schema";
import type { GroupEntry } from "./dto";
import type { GroupTx, MemberRow } from "./context";
import type { EntryInput } from "./validation";
import { saveEntry } from "./entries";

const mocks = vi.hoisted(() => ({ ledger: vi.fn(), values: vi.fn() }));
vi.mock("./context", () => ({ ledger: mocks.ledger, activity: vi.fn() }));
vi.mock("./merchant-rules", () => ({ readGroupRules: async () => [] }));
vi.mock("./split-edits", () => ({ reviewSplitEdit: vi.fn() }));
const actor = { id: "alex" } as MemberRow;
const draft = (patch: Partial<EntryInput> = {}): EntryInput => ({
  kind: "expense",
  amountCents: 1200,
  merchant: "Maple Market",
  note: "",
  occurredOn: "2026-11-02",
  categoryId: null,
  payerId: null,
  refundOf: null,
  settlement: false,
  splitMethod: "equal",
  participants: [],
  reason: "",
  ...patch,
});
function database() {
  return {
    select: () => ({
      from: (table: unknown) => ({
        where: async () =>
          table === groupCategories ? [{ id: "groceries", archived: false }] : [],
      }),
    }),
    insert: () => ({ values: mocks.values }),
  } as unknown as GroupTx;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.ledger.mockResolvedValue({ entries: [] });
  mocks.values.mockReturnValue({ returning: async () => [{ id: "saved" }] });
});
it.each(["expense", "income"] as const)(
  "rejects an uncategorized manual %s before insertion",
  async (kind) => {
    await expect(saveEntry(database(), "group", actor, draft({ kind }), true)).rejects.toThrow(
      "Choose a category",
    );
    expect(mocks.values).not.toHaveBeenCalled();
  },
);
it("retains a chosen income category on manual save", async () => {
  await saveEntry(
    database(),
    "group",
    actor,
    draft({ kind: "income", categoryId: "groceries" }),
    true,
  );
  expect(mocks.values).toHaveBeenCalledWith(
    expect.objectContaining({ kind: "income", categoryId: "groceries", amountCents: 1200 }),
  );
});
it("checks the inherited refund category rather than trusting the supplied category", async () => {
  mocks.ledger.mockResolvedValue({
    entries: [
      {
        id: "original",
        kind: "expense",
        amountCents: -5000,
        occurredOn: "2026-11-01",
        categoryId: null,
        settlement: false,
      },
    ] as GroupEntry[],
  });
  await expect(
    saveEntry(
      database(),
      "group",
      actor,
      draft({ kind: "refund", refundOf: "original", categoryId: "groceries" }),
      true,
    ),
  ).rejects.toThrow("Choose a category");
  expect(mocks.values).not.toHaveBeenCalled();
});
it("preserves the recurring generation path's uncategorized review policy", async () => {
  await expect(saveEntry(database(), "group", actor, draft())).resolves.toEqual({ id: "saved" });
});
