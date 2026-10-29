import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { InviteDelivery } from "./InviteDelivery";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const token = "a".repeat(48);
const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("navigator", { clipboard });
  clipboard.writeText.mockReset().mockResolvedValue(undefined);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<InviteDelivery token={token} groupName="Household" />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function click(label: string) {
  const button = [...container.querySelectorAll("button")].find((el) => el.textContent === label)!;
  await act(async () => button.click());
}
it("copies the raw code separately from the shareable URL and confirms each", async () => {
  await click("copyCode");
  expect(clipboard.writeText).toHaveBeenLastCalledWith(token);
  expect(container.querySelector('[role="status"]')?.textContent).toBe("codeCopied");
  await click("copyLink");
  expect(clipboard.writeText).toHaveBeenLastCalledWith(`${location.origin}/groups?invite=${token}`);
  expect(container.querySelector('[role="status"]')?.textContent).toBe("linkCopied");
});
it("opens native sharing when available without copying the code", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { share });
  await click("sendInviteLink");
  expect(share).toHaveBeenCalledWith({
    title: "shareInviteTitle",
    url: `${location.origin}/groups?invite=${token}`,
  });
  expect(clipboard.writeText).not.toHaveBeenCalled();
});
it("copies the link as a fallback on devices without native sharing", async () => {
  await click("sendInviteLink");
  expect(clipboard.writeText).toHaveBeenCalledWith(`${location.origin}/groups?invite=${token}`);
  expect(container.querySelector('[role="status"]')?.textContent).toBe("linkCopied");
});
it("treats cancellation as neutral and surfaces clipboard failures", async () => {
  Object.assign(navigator, {
    share: vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")),
  });
  await click("sendInviteLink");
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(clipboard.writeText).not.toHaveBeenCalled();
  clipboard.writeText.mockRejectedValueOnce(new Error("Denied"));
  await click("copyCode");
  expect(container.querySelector('[role="alert"]')?.textContent).toBe("copyFailed");
});
