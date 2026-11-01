import { expect, it } from "vitest";
import { CURRENT_RELEASE, hasUnseenRelease, validReleaseVersion } from "./whats-new";

it("offers the current release only to accounts that have not acknowledged it", () => {
  expect(hasUnseenRelease()).toBe(true);
  expect(hasUnseenRelease(0)).toBe(true);
  expect(hasUnseenRelease(CURRENT_RELEASE.version)).toBe(false);
  expect(hasUnseenRelease(CURRENT_RELEASE.version + 1)).toBe(false);
});
it("keeps curated links internal and acknowledgement versions bounded", () => {
  expect(CURRENT_RELEASE.highlights.every((item) => /^\/(groups|settings)$/.test(item.href))).toBe(
    true,
  );
  expect(validReleaseVersion(CURRENT_RELEASE.version)).toBe(true);
  expect(validReleaseVersion(CURRENT_RELEASE.version + 1)).toBe(false);
});
