import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import messages from "@/messages/en-CA.json";
import { GroupSettlements } from "./GroupSettlements";
import { RepaymentDialog } from "./RepaymentDialog";
import { GroupApiError } from "@/state/groups";
import { splitSnapshot } from "@/lib/groups/split";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace: keyof typeof messages) =>
    (key: string, values: Record<string, unknown> = {}) => {
      const text = (messages[namespace] as Record<string, string>)[key] ?? `${namespace}.${key}`;
      return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? name));
    },
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) => select({ locale: "en-CA" }),
}));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
const entry = (id: string, patch: Partial<GroupEntry> = {}): GroupEntry => ({
  id,
  authorId: "a",
  payerId: "a",
  categoryId: null,
  kind: "expense",
  amountCents: -10000,
  merchant: id,
  note: "",
  occurredOn: "2026-10-15",
  refundOf: null,
  settlement: true,
  splitMethod: "equal",
  version: 1,
  voidedAt: null,
  shares: [],
  ...patch,
});
function fixture(): GroupSnapshot {
  const changed = entry("Changed groceries");
  changed.splitResult = {
    snapshot: splitSnapshot(changed, [
      { memberId: "a", weight: 5000, amountCents: 5000 },
      { memberId: "b", weight: 5000, amountCents: 5000 },
    ]),
    review: "pending",
    reviewedVersion: 1,
    calculatedAt: "2026-10-15",
  };
  return {
    group: { memberId: "a", role: "member", revision: 1, archivedAt: null },
    members: [
      { id: "a", name: "Alex", status: "active" },
      { id: "b", name: "Taylor", status: "active" },
    ],
    categories: [],
    splitDefaults: { method: "equal", valid: true, participants: [] },
    entries: [
      changed,
      entry("New expense"),
      entry("Linked refund", {
        kind: "refund",
        amountCents: 1000,
        refundOf: changed.id,
        occurredOn: "2026-11-01",
      }),
    ],
    balances: { a: -4500, b: 4500 },
    transfers: [{ from: "a", to: "b", amountCents: 4500 }],
    repayments: [],
  } as unknown as GroupSnapshot;
}
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function render(node: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(node));
}
function button(text: string, scope: ParentNode = container) {
  const result = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent === text,
  );
  if (!result) throw Error(`Missing button ${text}`);
  return result;
}
const click = (text: string, scope?: ParentNode) => act(() => button(text, scope).click());
async function submit() {
  await act(async () => {
    container
      .querySelector('[role="dialog"] form')!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}
function changeText(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(
      input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
it.each(["a", "b"])(
  "lets either participant (%s) record a suggested repayment only after submission",
  async (memberId) => {
    const run = vi.fn().mockResolvedValue({ id: "payment" });
    const data = fixture();
    data.group.memberId = memberId;
    render(<GroupSettlements data={data} month="2026-10" run={run} busy={false} />);
    expect(container.textContent).toContain(memberId === "a" ? "You owe $45" : "You’re owed $45");
    const summary = [...container.querySelectorAll("p")].find(
      (p) => p.textContent === (memberId === "a" ? "You owe Taylor $45" : "Alex owes you $45"),
    )!.parentElement!;
    click("Record repayment", summary);
    expect(run).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="From"]')?.value).toBe(
      "a",
    );
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="To"]')?.value).toBe("b");
    await submit();
    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "repayment",
        senderId: "a",
        recipientId: "b",
        amountCents: 4500,
        duplicateIds: [],
      }),
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  },
);
it("retains failed repayment drafts and requires explicit duplicate acknowledgement", async () => {
  const run = vi
    .fn()
    .mockRejectedValueOnce(
      new GroupApiError("Matching payment", 409, { duplicateIds: ["existing"] }),
    )
    .mockResolvedValue({ id: "payment" });
  const onDone = vi.fn();
  render(
    <RepaymentDialog
      data={fixture()}
      run={run}
      busy={false}
      initial={{ from: "a", to: "b", amountCents: 4500 }}
      onDone={onDone}
    />,
  );
  await submit();
  expect(onDone).not.toHaveBeenCalled();
  expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe("45");
  expect(button("Record repayment").disabled).toBe(true);
  act(() => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
  await submit();
  expect(run).toHaveBeenLastCalledWith(expect.objectContaining({ duplicateIds: ["existing"] }));
  expect(onDone).toHaveBeenCalledOnce();
});
it("keeps linked refund decisions together across filters and waits for preview confirmation", async () => {
  const run = vi.fn().mockResolvedValue({});
  render(<GroupSettlements data={fixture()} month="2026-10" run={run} busy={false} />);
  expect(button("Review split · 1 included").disabled).toBe(true);
  click("Needs review · 1");
  click("Include shown records");
  click("Payments");
  click("Split expenses");
  expect(button("Needs review · 1").getAttribute("aria-pressed")).toBe("true");
  click("Review split · 3 included");
  expect(run).not.toHaveBeenCalled();
  const dialog = container.querySelector('[role="dialog"]')!;
  expect(dialog.textContent).toContain("Shares for this selection");
  expect(dialog.textContent).toContain("Overall balance after applying");
  const apply = [...dialog.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("Apply split"),
  )!;
  await act(async () => apply.click());
  expect(run).toHaveBeenCalledWith({
    type: "split",
    entries: expect.arrayContaining([
      { id: "Changed groceries", version: 1, decision: "include" },
      { id: "Linked refund", version: 1, decision: "include" },
      { id: "New expense", version: 1, decision: "include" },
    ]),
  });
});
it("reverses a repayment in a themed dialog, retaining its reason when the server fails", async () => {
  const data = fixture();
  data.repayments = [
    {
      id: "payment",
      senderId: "a",
      recipientId: "b",
      recordedBy: "b",
      amountCents: 4500,
      occurredOn: "2026-10-20",
      note: "Transfer",
      reversedAt: null,
      reversalReason: null,
    },
  ];
  const run = vi.fn().mockRejectedValueOnce(new Error("Offline")).mockResolvedValue({});
  const prompt = vi.spyOn(window, "prompt");
  render(<GroupSettlements data={data} month="2026-10" run={run} busy={false} />);
  click("Payments");
  click("Reverse payment");
  const dialog = container.querySelector('[role="dialog"]')!;
  expect(button("Reverse payment", dialog).disabled).toBe(true);
  changeText(dialog.querySelector("textarea")!, "Duplicate transfer");
  await submit();
  expect(dialog.textContent).toContain("Offline");
  expect(dialog.querySelector("textarea")!.value).toBe("Duplicate transfer");
  await submit();
  expect(run).toHaveBeenLastCalledWith({
    type: "reverse",
    id: "payment",
    reason: "Duplicate transfer",
  });
  expect(prompt).not.toHaveBeenCalled();
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});
it("shows repayment actions to every active member and hides them for archived groups", () => {
  const data = fixture();
  data.group.memberId = "c";
  render(<GroupSettlements data={data} month="2026-10" run={vi.fn()} busy={false} />);
  expect(
    [...container.querySelectorAll("button")].filter((b) => b.textContent === "Record repayment"),
  ).toHaveLength(2);
  act(() =>
    root.render(
      <GroupSettlements
        data={{ ...data, group: { ...data.group, archivedAt: "2026-10-01" } }}
        month="2026-10"
        run={vi.fn()}
        busy={false}
      />,
    ),
  );
  expect(
    [...container.querySelectorAll("button")].filter((b) => b.textContent === "Record repayment"),
  ).toHaveLength(0);
});

it("preserves decisions across period changes and invalidates preview approval on refresh", () => {
  const data = fixture();
  const run = vi.fn();
  render(<GroupSettlements data={data} month="2026-10" run={run} busy={false} />);
  click("Needs review · 1");
  click("Include shown records");
  click("All · 3");
  const skipped = container.querySelector<HTMLInputElement>(
    '[data-split-record="New expense"] input[type="checkbox"]',
  )!;
  act(() => skipped.click());
  expect(skipped.checked).toBe(false);
  const october = container.querySelector<HTMLInputElement>('input[aria-label="Oct 2026"]')!;
  const november = container.querySelector<HTMLInputElement>('input[aria-label="Nov 2026"]')!;
  act(() => november.click());
  act(() => october.click());
  expect(container.querySelector('[data-split-record="New expense"]')).toBeNull();
  act(() => october.click());
  expect(
    container.querySelector<HTMLInputElement>('[data-split-record="New expense"] input')!.checked,
  ).toBe(false);
  click("Review split · 2 included");
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  act(() =>
    root.render(
      <GroupSettlements
        data={{ ...data, group: { ...data.group, revision: 2 } }}
        month="2026-10"
        run={run}
        busy={false}
      />,
    ),
  );
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(button("Review split · 2 included").disabled).toBe(false);
  const edited = {
    ...data,
    entries: data.entries.map((e, index) =>
      index === 0 ? { ...e, version: 2, amountCents: -12000 } : e,
    ),
    group: { ...data.group, revision: 3 },
  };
  act(() => root.render(<GroupSettlements data={edited} month="2026-10" run={run} busy={false} />));
  expect(button("Review split · 0 included").disabled).toBe(true);
  expect(run).not.toHaveBeenCalled();
});

it("leaves unsplit shared-fund families out without hiding old calculated debt", () => {
  const data = fixture();
  const shared = entry("Shared expense", { payerId: null });
  data.entries.push(
    shared,
    entry("Shared refund", { kind: "refund", amountCents: 500, refundOf: shared.id }),
  );
  render(<GroupSettlements data={data} month="2026-10" run={vi.fn()} busy={false} />);
  expect(container.querySelector('[data-split-record="Shared expense"]')).toBeNull();
  expect(container.querySelector('[data-split-record="Shared refund"]')).toBeNull();
  expect(container.querySelector('[data-split-record="Changed groceries"]')).not.toBeNull();
});

it("requires a reason only for other/former members and never offers the sender as recipient", () => {
  const data = fixture();
  data.members.push({ id: "c", name: "Morgan", status: "active", role: "member", userId: null });
  data.group.memberId = "c";
  render(
    <RepaymentDialog
      data={data}
      run={vi.fn()}
      busy={false}
      initial={{ from: "a", to: "b", amountCents: 4500 }}
      onDone={vi.fn()}
    />,
  );
  const reason = container.querySelector<HTMLInputElement>('input[maxlength="300"]')!;
  expect(reason.required).toBe(true);
  expect(button("Record repayment").disabled).toBe(true);
  expect(
    [...container.querySelectorAll('select[aria-label="To"] option')].map((e) =>
      e.getAttribute("value"),
    ),
  ).not.toContain("a");
  changeText(reason, "Recorded for Alex and Taylor");
  expect(button("Record repayment").disabled).toBe(false);
});

it("confirms closing a changed payment draft and retains it after cancellation", async () => {
  const onDone = vi.fn();
  render(
    <RepaymentDialog data={fixture()} run={vi.fn()} busy={false} initial={null} onDone={onDone} />,
  );
  changeText(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!, "12.34");
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[aria-label="Close"]')!.click(),
  );
  expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
  const cancel = [
    ...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button'),
  ].find((b) => b.textContent === "Cancel")!;
  await act(async () => cancel.click());
  expect(onDone).not.toHaveBeenCalled();
  expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!.value).toBe(
    "12.34",
  );
});
