import { beforeEach, expect, it, vi } from "vitest";
let motion: typeof import("./context-switch-motion");
beforeEach(async () => {
  vi.resetModules();
  motion = await import("./context-switch-motion");
});
it("leaves initial visits still and hands a deliberate switch to the destination shells", () => {
  expect(motion.contextSwitchMotionOrigin("group", "/groups/maple", 100)).toBeUndefined();
  motion.recordContextSwitch("personal", "group", "/groups/maple?section=transactions", 100);
  expect(motion.contextSwitchMotionOrigin("group", "/groups/maple", 150)).toBe("personal");
  // Responsive shells may both mount; neither consumes the other's animation.
  expect(motion.contextSwitchMotionOrigin("group", "/groups/maple", 151)).toBe("personal");
  expect(
    motion.contextSwitchMotionOrigin("group", "/groups/maple/transactions", 152),
  ).toBeUndefined();
});
it("ignores expired, wrong-context and clock-regressed markers", () => {
  motion.recordContextSwitch("personal", "group", "/groups/maple", 100);
  expect(motion.contextSwitchMotionOrigin("group", "/groups/maple", 1100)).toBeUndefined();
  expect(motion.contextSwitchMotionOrigin("personal", "/groups/maple", 150)).toBeUndefined();
  expect(motion.contextSwitchMotionOrigin("group", "/groups/maple", 99)).toBeUndefined();
});
it("supports the reverse direction without animating same-context clicks", () => {
  motion.recordContextSwitch("personal", "personal", "/home", 100);
  expect(motion.contextSwitchMotionOrigin("personal", "/home", 101)).toBeUndefined();
  motion.recordContextSwitch("group", "personal", "/transactions", 200);
  expect(motion.contextSwitchMotionOrigin("personal", "/transactions", 201)).toBe("group");
});
