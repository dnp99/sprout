import { describe, expect, it } from "vitest";
import { externalId } from "./dedupe";

const base = {
  occurredAt: "2026-06-01",
  merchant: "Uber Eats",
  amountCents: -2774,
  sourceAccount: "Chequing",
  occurrence: 0,
};

describe("externalId", () => {
  it("is deterministic and case-insensitive on merchant/account", () => {
    expect(externalId(base)).toBe(
      externalId({ ...base, merchant: "UBER EATS", sourceAccount: "chequing" }),
    );
  });

  it("differs by occurrence so same-day identical charges are preserved", () => {
    expect(externalId(base)).not.toBe(externalId({ ...base, occurrence: 1 }));
  });

  it("differs when amount or date changes", () => {
    expect(externalId(base)).not.toBe(externalId({ ...base, amountCents: -2775 }));
    expect(externalId(base)).not.toBe(externalId({ ...base, occurredAt: "2026-06-02" }));
  });
});
