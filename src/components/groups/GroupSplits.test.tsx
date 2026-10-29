import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { EntryForm } from "./EntryForm";
import { GroupSplitSettings } from "./GroupSplitSettings";
import type { GroupSnapshot, GroupEntry } from "@/lib/groups/dto";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { name: string }) =>
    values ? `${key} ${values.name}` : key,
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) => select({ locale: "en-CA" }),
}));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
vi.mock("@/components/shared/AmountCalculator", () => ({ AmountCalculator: () => null }));
const data = {
  group: { memberId: "a", role: "owner", revision: 1 },
  members: [
    { id: "a", name: "Alice", status: "active" },
    { id: "b", name: "Bob", status: "active" },
  ],
  categories: [{ id: "food", name: "Food", archived: false }],
  splitDefaults: {
    method: "equal",
    valid: true,
    participants: [
      { memberId: "a", weight: 1 },
      { memberId: "b", weight: 1 },
    ],
  },
  categorySplits: [
    {
      categoryId: "food",
      method: "percentage",
      valid: true,
      participants: [
        { memberId: "a", weight: 7500 },
        { memberId: "b", weight: 2500 },
      ],
    },
  ],
} as unknown as GroupSnapshot;
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
function render(node: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(node));
}
function select(label: string, value: string) {
  const input = container.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
  act(() => {
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
const percentages = () => [
  ...container.querySelectorAll<HTMLInputElement>('input[aria-label^="percentFor"]'),
];
it("keeps allocation controls out of original entry creation", () => {
  render(
    <EntryForm
      data={data}
      existing={null}
      refund={null}
      run={vi.fn()}
      busy={false}
      onDone={vi.fn()}
    />,
  );
  select("category", "food");
  expect(percentages()).toHaveLength(0);
  expect(container.querySelector('select[aria-label="splitMethod"]')).toBeNull();
  expect(container.textContent).not.toContain("includeSettlement");
});
it("offers optional review when a calculated record's category changes", () => {
  const existing = {
    id: "entry",
    kind: "expense",
    categoryId: null,
    payerId: "a",
    authorId: "a",
    amountCents: -10000,
    occurredOn: "2026-10-01",
    settlement: true,
    splitMethod: "percentage",
    shares: [
      { memberId: "a", weight: 6000, amountCents: 6000 },
      { memberId: "b", weight: 4000, amountCents: 4000 },
    ],
  } as GroupEntry;
  render(
    <EntryForm
      data={data}
      existing={existing}
      refund={null}
      run={vi.fn()}
      busy={false}
      onDone={vi.fn()}
    />,
  );
  select("category", "food");
  expect(percentages()).toHaveLength(0);
  const review = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find(
    (input) => input.parentElement?.textContent?.includes("includeNextSplit"),
  );
  expect(review?.checked).toBe(true);
  act(() => review!.click());
  expect(review?.checked).toBe(false);
});
it("edits percentages only in the Split workspace and resets categories without changing the baseline", async () => {
  const run = vi.fn().mockResolvedValue({ id: "food" });
  render(<GroupSplitSettings data={data} run={run} busy={false} />);
  expect(container.textContent).toContain("75%");
  const edit = [...container.querySelectorAll("button")].find(
    (b) => b.textContent === "editRatios",
  )!;
  act(() => edit.click());
  select("category", "food");
  expect(percentages().map((e) => e.value)).toEqual(["75", "25"]);
  expect(percentages().every((e) => e.parentElement?.textContent === "%")).toBe(true);
  const reset = [...container.querySelectorAll("button")].find(
    (b) => b.textContent === "resetRatio",
  )!;
  act(() => reset.click());
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(run).toHaveBeenCalledWith({
    type: "splitRules",
    participants: expect.arrayContaining([
      { memberId: "a", weight: 5000 },
      { memberId: "b", weight: 5000 },
    ]),
    categories: [],
  });
});
