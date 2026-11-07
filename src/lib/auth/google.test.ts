import { expect, it, afterEach, vi } from "vitest";
import {
  googleConfig,
  newGoogleFlow,
  validateGoogleFlow,
  googleChallenge,
  googleIdentity,
} from "./google";
import type { TokenPayload } from "google-auth-library";
afterEach(() => vi.unstubAllEnvs());
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
it("binds short-lived callbacks to the initiating browser and rejects stale/altered state", () => {
  const flow = newGoogleFlow(1000);
  expect(validateGoogleFlow(encode(flow), flow.state, 1001)).toEqual(flow);
  expect(validateGoogleFlow(encode(flow), "other", 1001)).toBeNull();
  expect(validateGoogleFlow(encode(flow), flow.state, 601001)).toBeNull();
  expect(validateGoogleFlow(encode(flow), flow.state, 999)).toBeNull();
  expect(validateGoogleFlow("not-json", flow.state)).toBeNull();
  expect(validateGoogleFlow(undefined, flow.state)).toBeNull();
  expect(validateGoogleFlow(encode({ ...flow, verifier: "bad" }), flow.state, 1001)).toBeNull();
  expect(googleChallenge(flow.verifier)).toHaveLength(43);
});
it("requires the verified Google subject, verified email and matching nonce", () => {
  const payload = {
    sub: "google-subject",
    email: "ALEX@example.test",
    email_verified: true,
    nonce: "nonce",
    name: "Alex",
  } as TokenPayload;
  expect(googleIdentity(payload, "nonce")).toEqual({
    subject: "google-subject",
    email: "alex@example.test",
    name: "Alex",
  });
  expect(() => googleIdentity({ ...payload, email_verified: false }, "nonce")).toThrow();
  expect(() => googleIdentity(payload, "different")).toThrow();
  expect(() => googleIdentity(undefined, "nonce")).toThrow();
});
it("requires a configured trusted origin and never permits production HTTP", () => {
  vi.stubEnv("GOOGLE_CLIENT_ID", "client");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
  vi.stubEnv("GOOGLE_AUTH_ORIGIN", "https://sprout.example");
  expect(googleConfig()?.redirectUri).toBe("https://sprout.example/api/auth/google/callback");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("GOOGLE_AUTH_ORIGIN", "http://localhost:3000");
  expect(() => googleConfig()).toThrow();
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
  expect(googleConfig()).toBeNull();
});
