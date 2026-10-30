import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage, parseLocalePref, resolveLocale } from "./locale";

describe("parseLocalePref", () => {
  it("accepts the known preferences", () => {
    expect(parseLocalePref("system")).toBe("system");
    expect(parseLocalePref("en-CA")).toBe("en-CA");
    expect(parseLocalePref("fr-CA")).toBe("fr-CA");
  });

  it("treats missing or garbled cookies as system", () => {
    expect(parseLocalePref(undefined)).toBe("system");
    expect(parseLocalePref(null)).toBe("system");
    expect(parseLocalePref("")).toBe("system");
    expect(parseLocalePref("de-DE")).toBe("system");
    expect(parseLocalePref("french")).toBe("system");
  });
});

describe("localeFromAcceptLanguage", () => {
  it("matches the first supported primary subtag, quality-ordered", () => {
    expect(localeFromAcceptLanguage("fr-CA,fr;q=0.9,en;q=0.8")).toBe("fr-CA");
    expect(localeFromAcceptLanguage("fr-FR,en;q=0.8")).toBe("fr-CA"); // any French → fr-CA
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en-CA");
  });

  it("skips unsupported languages to find a supported one", () => {
    expect(localeFromAcceptLanguage("de-DE,fr;q=0.8,en;q=0.7")).toBe("fr-CA");
    expect(localeFromAcceptLanguage("de-DE,ja;q=0.8")).toBe("en-CA");
  });

  it("defaults to en-CA when the header is missing", () => {
    expect(localeFromAcceptLanguage(undefined)).toBe("en-CA");
    expect(localeFromAcceptLanguage("")).toBe("en-CA");
  });
});

describe("resolveLocale", () => {
  it("an explicit preference wins over the browser language", () => {
    expect(resolveLocale("en-CA", "fr-CA,fr;q=0.9")).toBe("en-CA");
    expect(resolveLocale("fr-CA", "en-US")).toBe("fr-CA");
  });

  it("system follows Accept-Language", () => {
    expect(resolveLocale("system", "fr-CA")).toBe("fr-CA");
    expect(resolveLocale("system", undefined)).toBe("en-CA");
  });
});

it("recognizes Chinese preferences and script/region negotiation", () => {
  for (const locale of ["zh-Hans", "zh-Hant"] as const) {
    expect(parseLocalePref(locale)).toBe(locale);
    expect(resolveLocale(locale, "en-CA")).toBe(locale);
  }
  for (const tag of ["zh", "zh-CN", "zh-SG", "zh-Hans", "zh-Hans-TW"]) {
    expect(localeFromAcceptLanguage(tag)).toBe("zh-Hans");
  }
  for (const tag of ["zh-TW", "zh-HK", "zh-MO", "zh-Hant", "zh-Hant-CN"]) {
    expect(localeFromAcceptLanguage(tag)).toBe("zh-Hant");
  }
  expect(localeFromAcceptLanguage("en;q=0.2,zh-Hant;q=0.9")).toBe("zh-Hant");
  expect(localeFromAcceptLanguage("zh;q=0,fr;q=0.8")).toBe("fr-CA");
  expect(localeFromAcceptLanguage("english,fr;q=0.8")).toBe("fr-CA");
});
