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
