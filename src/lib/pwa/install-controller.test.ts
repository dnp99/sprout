import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInstallController } from "./install-controller";

let controller: ReturnType<typeof createInstallController>;
let stop: (() => void) | undefined;
let media: EventTarget & { matches: boolean };
type BootstrapWindow = Window & { __sproutPwaDeferred?: Event };

beforeEach(() => {
  controller = createInstallController();
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
});
afterEach(() => {
  stop?.();
  stop = undefined;
  delete (window as BootstrapWindow).__sproutPwaDeferred;
  vi.unstubAllGlobals();
});

function offer() {
  let resolve!: (choice: { outcome: "accepted" | "dismissed" }) => void;
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: new Promise<{ outcome: "accepted" | "dismissed" }>((done) => {
      resolve = done;
    }),
  });
  return { event, resolve };
}

function install() {
  const state = controller.getSnapshot();
  if (state.status !== "prompt-ready") throw Error("Expected an available install prompt");
  return state.install;
}

it("consumes an early bootstrap prompt once and waits for observed installation", async () => {
  const { event, resolve } = offer();
  (window as BootstrapWindow).__sproutPwaDeferred = event;
  stop = controller.start(window);
  expect(event.defaultPrevented).toBe(true);
  expect((window as BootstrapWindow).__sproutPwaDeferred).toBeUndefined();
  const request = install();
  const first = request();
  const second = request();
  expect(event.prompt).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().status).toBe("prompting");
  resolve({ outcome: "accepted" });
  await Promise.all([first, second]);
  expect(controller.getSnapshot().status).toBe("install-requested");
  await request();
  expect(event.prompt).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new Event("appinstalled"));
  expect(controller.getSnapshot().status).toBe("installed");
});

it("returns to guidance after dismissal or native prompt rejection", async () => {
  stop = controller.start(window);
  const first = offer();
  window.dispatchEvent(first.event);
  const pending = install()();
  first.resolve({ outcome: "dismissed" });
  await pending;
  expect(controller.getSnapshot().status).toBe("instructions");
  const second = offer();
  second.event.prompt.mockRejectedValueOnce(Error("Native prompt failed"));
  window.dispatchEvent(second.event);
  await expect(install()()).rejects.toThrow("Native prompt failed");
  expect(controller.getSnapshot().status).toBe("instructions");
});

it("does not let a late choice overwrite installation or a newer prompt", async () => {
  stop = controller.start(window);
  const first = offer();
  window.dispatchEvent(first.event);
  const pending = install()();
  const next = offer();
  window.dispatchEvent(next.event);
  first.resolve({ outcome: "dismissed" });
  await pending;
  expect(controller.getSnapshot().status).toBe("prompt-ready");
  const nextPending = install()();
  window.dispatchEvent(new Event("appinstalled"));
  next.resolve({ outcome: "accepted" });
  await nextPending;
  expect(controller.getSnapshot().status).toBe("installed");
});

it("ignores old promises and removes event handlers after cleanup", async () => {
  stop = controller.start(window);
  const first = offer();
  window.dispatchEvent(first.event);
  const pending = install()();
  stop();
  stop = controller.start(window);
  first.resolve({ outcome: "accepted" });
  await pending;
  expect(controller.getSnapshot().status).toBe("instructions");
  stop();
  window.dispatchEvent(offer().event);
  window.dispatchEvent(new Event("appinstalled"));
  expect(controller.getSnapshot().status).toBe("unavailable");
});

it("withholds installation in insecure contexts and recognizes standalone changes", () => {
  vi.stubGlobal("isSecureContext", false);
  stop = controller.start(window);
  window.dispatchEvent(offer().event);
  expect(controller.getSnapshot().status).toBe("unavailable");
  stop();
  vi.stubGlobal("isSecureContext", true);
  stop = controller.start(window);
  media.matches = true;
  media.dispatchEvent(new Event("change"));
  expect(controller.getSnapshot().status).toBe("installed");
  window.dispatchEvent(offer().event);
  expect(controller.getSnapshot().status).toBe("installed");
});
