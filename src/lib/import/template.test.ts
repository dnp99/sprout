import { describe, expect, it } from "vitest";
import { readCsv } from "./read-csv";
import { detectPreset } from "./presets";
import { sproutPreset } from "./presets/sprout";
import { SPROUT_TEMPLATE_CSV, SPROUT_TEMPLATE_FILENAME } from "./template";

describe("Sprout import template", () => {
  it("has the auto-detected template headers and a valid signed example", () => {
    const rows = readCsv(SPROUT_TEMPLATE_CSV);
    expect(Object.keys(rows[0] ?? {})).toEqual(sproutPreset.detection.requiredHeaders);
    expect(rows[0]?.Amount).toBe("-4.50");
    expect(SPROUT_TEMPLATE_FILENAME).toBe("sprout-import-template.csv");
    expect(detectPreset(Object.keys(rows[0] ?? {}), SPROUT_TEMPLATE_FILENAME)).toEqual({
      presetId: "sprout",
      confidence: "high",
    });
  });
});
