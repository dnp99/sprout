import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

function worker() {
  const handlers: Record<string, (event: unknown) => void> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined),
    openWindow = vi.fn().mockResolvedValue(undefined),
    matchAll = vi.fn().mockResolvedValue([]);
  runInNewContext(readFileSync("public/push-sw.js", "utf8"), {
    URL,
    self: {
      location: { origin: "https://sprout.test" },
      registration: { showNotification },
      clients: { openWindow, matchAll },
      addEventListener: (name: string, handle: (event: unknown) => void) => {
        handlers[name] = handle;
      },
    },
  });
  return { handlers, showNotification, openWindow, matchAll };
}
it("displays push content with a stable tag, rejects external destinations, and never handles fetch", async () => {
  const w = worker();
  let pending: Promise<unknown> | undefined;
  w.handlers.push({
    data: {
      json: () => ({
        title: "Sprout",
        body: "A new record",
        tag: "event",
        url: "https://evil.test/",
      }),
    },
    waitUntil: (p: Promise<unknown>) => {
      pending = p;
    },
  });
  await pending;
  expect(w.showNotification).toHaveBeenCalledWith(
    "Sprout",
    expect.objectContaining({ tag: "event", data: { url: "/home" } }),
  );
  expect(w.handlers.fetch).toBeUndefined();
});
it("opens the destination without navigating another window away from an unsaved draft", async () => {
  const w = worker(),
    navigate = vi.fn(),
    focus = vi.fn();
  w.matchAll.mockResolvedValue([
    { url: "https://sprout.test/groups/other/transactions", navigate, focus },
  ]);
  let pending: Promise<unknown> | undefined;
  w.handlers.notificationclick({
    notification: { close: vi.fn(), data: { url: "/transactions" } },
    waitUntil: (p: Promise<unknown>) => {
      pending = p;
    },
  });
  await pending;
  expect(navigate).not.toHaveBeenCalled();
  expect(w.openWindow).toHaveBeenCalledWith("https://sprout.test/transactions");
});
