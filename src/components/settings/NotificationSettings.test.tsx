import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { NotificationSettings } from "./NotificationSettings";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) => select({ locale: "en-CA", user: { id: "user" } }),
}));
vi.mock("@/hooks/usePwaInstall", () => ({ usePwaInstall: () => ({ status: "installed" }) }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
it("repairs a lost browser subscription after permission is restored without another permission prompt", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const notification = {
    permission: "denied",
    requestPermission: vi.fn().mockResolvedValue("granted"),
  };
  vi.stubGlobal("Notification", notification);
  vi.stubGlobal("PushManager", class {});
  const subscription = { toJSON: () => ({ endpoint: "test" }) },
    subscribe = vi.fn().mockResolvedValue(subscription);
  const registration = {
    pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe },
  };
  vi.stubGlobal("navigator", {
    serviceWorker: {
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
    },
  });
  const settings = {
    configured: true,
    publicKey: "B".repeat(87),
    groupActivity: true,
    weeklyReminder: true,
    timeZone: "America/Toronto",
    subscribed: true,
  };
  const requests: Record<string, unknown>[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, options) => {
      if (options?.body) requests.push(JSON.parse(options.body));
      return { ok: true, json: async () => settings };
    }),
  );
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<NotificationSettings />));
  const save = [...container.querySelectorAll("button")].find((b) => b.textContent === "save")!;
  expect(save.disabled).toBe(true);
  expect(notification.requestPermission).not.toHaveBeenCalled();
  notification.permission = "granted";
  act(() => window.dispatchEvent(new Event("focus")));
  expect(save.disabled).toBe(false);
  await act(async () => save.click());
  expect(subscribe).toHaveBeenCalledTimes(1);
  expect(requests.map((r) => r.type)).toEqual(["subscribe", "preferences"]);
  expect(notification.requestPermission).not.toHaveBeenCalled();
});
