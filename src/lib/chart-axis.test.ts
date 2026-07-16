import { describe, expect, it } from "vitest";
import { buildMoneyAxis } from "./chart-axis";

describe("buildMoneyAxis", () => {
  it("returns readable ticks aligned to a rounded chart ceiling", () => {
    expect(buildMoneyAxis(2798, 2)).toEqual({
      maxCents: 3000,
      ticks: [
        { value: 0, label: "$0" },
        { value: 1500, label: "$15" },
        { value: 3000, label: "$30" },
      ],
    });
  });

  it("uses compact labels for larger values", () => {
    expect(buildMoneyAxis(159553, 2).ticks.map((tick) => tick.label)).toEqual(["$0", "$1K", "$2K"]);
  });
});
