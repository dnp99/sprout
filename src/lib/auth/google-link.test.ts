import { expect, it } from "vitest";
import { googleLinkReturnPath, googleSessionHash, validGoogleLinkIntent } from "./google-link";
import { newGoogleFlow, validateGoogleFlow } from "./google";
const intent = {
  userId: "00000000-0000-4000-8000-000000000001",
  sessionHash: googleSessionHash("opaque-session"),
  returnPath: "/transactions",
};
it("preserves only known internal ledger destinations", () => {
  expect(googleLinkReturnPath("/transactions")).toBe("/transactions");
  expect(googleLinkReturnPath("/groups")).toBe("/groups");
  const group = "/groups/00000000-0000-4000-8000-000000000002/transactions";
  expect(googleLinkReturnPath(group)).toBe(group);
  for (const path of [
    "//evil.example",
    "https://evil.example",
    "/logout",
    "/home?url=evil",
    "/\\evil.example",
    null,
  ])
    expect(googleLinkReturnPath(path)).toBe("/home");
});
it("validates a linking intent and rejects a forged malformed flow", () => {
  expect(validGoogleLinkIntent(intent)).toBe(true);
  expect(validGoogleLinkIntent({ ...intent, returnPath: "//evil.example" })).toBe(false);
  expect(validGoogleLinkIntent({ ...intent, sessionHash: "bad" })).toBe(false);
  const flow = newGoogleFlow(Date.now(), intent);
  const encoded = Buffer.from(JSON.stringify(flow)).toString("base64url");
  expect(validateGoogleFlow(encoded, flow.state)?.link).toEqual(intent);
  const malformed = Buffer.from(
    JSON.stringify({ ...flow, link: { ...intent, userId: "" } }),
  ).toString("base64url");
  expect(validateGoogleFlow(malformed, flow.state)).toBeNull();
  expect(googleSessionHash("other-session")).not.toBe(intent.sessionHash);
});

it("authenticates link intent metadata so a caller cannot forge fresh password proof", async () => {
  const { serializeGoogleFlow, readGoogleFlow } = await import("./google");
  const flow = newGoogleFlow(Date.now(), intent);
  const signed = serializeGoogleFlow(flow, "server-only-secret");
  expect(readGoogleFlow(signed, flow.state, "server-only-secret")?.link).toEqual(intent);
  expect(readGoogleFlow(signed, flow.state, "other-secret")).toBeNull();
  const forged = Buffer.from(
    JSON.stringify({
      ...flow,
      link: { ...intent, userId: "00000000-0000-4000-8000-000000000009" },
    }),
  ).toString("base64url");
  expect(
    readGoogleFlow(`${forged}.${signed.split(".")[1]}`, flow.state, "server-only-secret"),
  ).toBeNull();
  expect(readGoogleFlow(forged, flow.state, "server-only-secret")).toBeNull();
});
