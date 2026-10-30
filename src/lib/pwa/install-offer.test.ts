import { expect, it, vi } from "vitest";
import { canOfferInstall, createInstallOfferGate } from "./install-offer";

it("offers native capability or specific platform instructions, never an installed app", () => {
  expect(canOfferInstall({ status: "prompt-ready", platform: "browser", install: vi.fn() })).toBe(
    true,
  );
  expect(canOfferInstall({ status: "instructions", platform: "ios" })).toBe(true);
  expect(canOfferInstall({ status: "instructions", platform: "mac-safari" })).toBe(true);
  expect(canOfferInstall({ status: "instructions", platform: "browser" })).toBe(false);
  expect(canOfferInstall({ status: "installed" })).toBe(false);
  expect(canOfferInstall({ status: "unavailable" })).toBe(false);
});
it("pauses across sign-ins for seven days and claims only once per document", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const gate = createInstallOfferGate(),
    now = 1000000000;
  expect(gate(storage, now)).toBe(true);
  expect(gate(storage, now + 8 * 86400000)).toBe(false);
  expect(createInstallOfferGate()(storage, now + 6 * 86400000)).toBe(false);
  expect(createInstallOfferGate()(storage, now + 7 * 86400000)).toBe(true);
});
it("continues without persistent storage and tolerates invalid stored values", () => {
  const blocked = {
    getItem: () => {
      throw Error("blocked");
    },
    setItem: () => {
      throw Error("blocked");
    },
  };
  const gate = createInstallOfferGate();
  expect(gate(blocked)).toBe(true);
  expect(gate(blocked)).toBe(false);
  expect(createInstallOfferGate()({ getItem: () => "invalid", setItem: vi.fn() })).toBe(true);
});
