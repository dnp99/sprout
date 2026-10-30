import { beforeEach, describe, expect, it, vi } from "vitest";
import { aiParseCapture } from "./ai-parse";
import { resolveCapture } from "./capture";

vi.mock("./ai-parse", () => ({ aiParseCapture: vi.fn() }));
const mockAi = vi.mocked(aiParseCapture);

const NOW = new Date(2026, 6, 9);

describe("resolveCapture", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the regex result and never calls the AI when an amount is found", async () => {
    const d = await resolveCapture("coffee 4.50", NOW);
    expect(d.amountCents).toBe(-450);
    expect(d.merchant).toBe("Coffee");
    expect(mockAi).not.toHaveBeenCalled();
  });

  it("falls back to the AI when the regex finds no digits (spelled-out amount)", async () => {
    mockAi.mockResolvedValueOnce({ merchant: "McDonald's", amountCents: -500 });
    const d = await resolveCapture("McDonald's five dollars", NOW);
    expect(mockAi).toHaveBeenCalledOnce();
    expect(d.amountCents).toBe(-500);
    expect(d.merchant).toBe("McDonald's");
    expect(d.needsClarification).toBeUndefined();
  });

  it("keeps needs-clarification when both the regex and the AI come up empty", async () => {
    mockAi.mockResolvedValueOnce(null);
    const d = await resolveCapture("what did i spend", NOW);
    expect(mockAi).toHaveBeenCalledOnce();
    expect(d.needsClarification).toBe(true);
    expect(d.amountCents).toBe(0);
  });
});

it("handles Chinese without the AI or any interface-language dependency", async () => {
  mockAi.mockClear();
  const draft = await resolveCapture("昨天咖啡十二元五角", NOW);
  expect(draft).toMatchObject({ merchant: "咖啡", amountCents: -1250, occurredAt: "2026-07-08" });
  expect(mockAi).not.toHaveBeenCalled();
});

it("uses multilingual AI interpretation for explicit Chinese dates", async () => {
  mockAi.mockResolvedValueOnce({ merchant: "午饭", amountCents: -3500, occurredAt: "2026-07-08" });
  const draft = await resolveCapture("7月8日午饭35元", NOW);
  expect(draft).toMatchObject({ merchant: "午饭", amountCents: -3500, occurredAt: "2026-07-08" });
});
