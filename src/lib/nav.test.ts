import { describe, expect, it } from "vitest";
import {
  SECTION_PATHS,
  pathForSection,
  sectionForMobileScreen,
  sectionForPath,
  sectionMobileScreen,
} from "./nav";

describe("pathForSection / sectionForPath", () => {
  it("maps overview to /home and round-trips", () => {
    expect(pathForSection("overview")).toBe("/home");
    expect(sectionForPath("/home")).toBe("overview");
  });

  it("maps other sections to /<name> and round-trips", () => {
    for (const s of [
      "transactions",
      "categories",
      "trends",
      "goals",
      "bills",
      "import",
      "settings",
    ] as const) {
      expect(pathForSection(s)).toBe(`/${s}`);
      expect(sectionForPath(`/${s}`)).toBe(s);
    }
  });

  it("returns null for non-section paths", () => {
    expect(sectionForPath("/login")).toBeNull();
    expect(sectionForPath("/logout")).toBeNull();
    expect(sectionForPath("/")).toBeNull();
    expect(sectionForPath("/overview")).toBeNull(); // overview lives at /home
    expect(sectionForPath("/nope")).toBeNull();
  });

  it("lists every section route path", () => {
    expect(SECTION_PATHS).toContain("/home");
    expect(SECTION_PATHS).toContain("/settings");
    expect(SECTION_PATHS).toHaveLength(8);
  });
});

describe("section ↔ mobile screen", () => {
  it("maps a section to its primary mobile screen and back", () => {
    expect(sectionMobileScreen("transactions")).toBe("history");
    expect(sectionForMobileScreen("history")).toBe("transactions");
    expect(sectionMobileScreen("overview")).toBe("home");
    expect(sectionForMobileScreen("home")).toBe("overview");
  });

  it("returns null for detail/transient mobile screens", () => {
    expect(sectionForMobileScreen("txnDetail")).toBeNull();
    expect(sectionForMobileScreen("catDetail")).toBeNull();
    expect(sectionForMobileScreen("addBill")).toBeNull();
    expect(sectionForMobileScreen("search")).toBeNull();
  });
});
