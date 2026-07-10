import { describe, expect, it } from "vitest";
import {
  computeTwilioSignature,
  parseWhatsappCommand,
  twimlMessage,
  verifyTwilioSignature,
} from "./twilio";

// Twilio's own documented example — the canonical validation vector.
// https://www.twilio.com/docs/usage/security#validating-requests
const AUTH = "12345";
const URL = "https://mycompany.com/myapp.php?foo=1&bar=2";
const PARAMS = {
  Digits: "1234",
  To: "+18005551212",
  From: "+14158675310",
  Caller: "+14158675310",
  CallSid: "CA1234567890ABCDE",
};
// Verified independently via `openssl dgst -sha1 -hmac 12345 -binary | base64`.
const EXPECTED = "GvWf1cFY/Q7PnoempGyD5oXAezc=";

describe("Twilio signature", () => {
  it("matches Twilio's documented vector", () => {
    expect(computeTwilioSignature(AUTH, URL, PARAMS)).toBe(EXPECTED);
  });

  it("verifies a correct signature and rejects a wrong/missing one", () => {
    expect(verifyTwilioSignature(AUTH, URL, PARAMS, EXPECTED)).toBe(true);
    expect(verifyTwilioSignature(AUTH, URL, PARAMS, "bogus")).toBe(false);
    expect(verifyTwilioSignature(AUTH, URL, PARAMS, null)).toBe(false);
    expect(verifyTwilioSignature("wrong-token", URL, PARAMS, EXPECTED)).toBe(false);
  });
});

describe("twimlMessage", () => {
  it("wraps and XML-escapes the message", () => {
    const xml = twimlMessage(`Logged $4.50 · Ben & Jerry's <3`);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Response><Message>')).toBe(true);
    expect(xml).toContain("Ben &amp; Jerry&apos;s &lt;3");
    expect(xml.endsWith("</Message></Response>")).toBe(true);
  });
});

describe("parseWhatsappCommand", () => {
  it("detects a link code (case-insensitive, uppercased)", () => {
    expect(parseWhatsappCommand("link sprt-4k9q")).toEqual({ kind: "link", code: "SPRT-4K9Q" });
  });
  it("detects lone U / E as undo / edit", () => {
    expect(parseWhatsappCommand("U")).toEqual({ kind: "undo" });
    expect(parseWhatsappCommand(" e ")).toEqual({ kind: "edit" });
  });
  it("treats everything else as a capture", () => {
    expect(parseWhatsappCommand("coffee 4.50")).toEqual({ kind: "capture", text: "coffee 4.50" });
    // 'e' only counts alone — a word starting with e is still a capture.
    expect(parseWhatsappCommand("eggs 5")).toEqual({ kind: "capture", text: "eggs 5" });
  });
});
