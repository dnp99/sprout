"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import type { NotificationSettings as Settings } from "@/lib/notifications/dto";

/** Explicit device permission and separate account preferences share one themed settings surface. */
export function NotificationSettings() {
  const t = useTranslations("settingsPage.push"),
    locale = useStore((s) => s.locale),
    userId = useStore((s) => s.user.id);
  const install = usePwaInstall();
  const [data, setData] = useState<Settings | null>(null),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false);
  const [groupActivity, setGroupActivity] = useState(true),
    [weeklyReminder, setWeeklyReminder] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const supported = permission !== null;
  useEffect(() => {
    const refreshPermission = () =>
      setPermission(
        typeof Notification !== "undefined" &&
          "serviceWorker" in navigator &&
          "PushManager" in window
          ? Notification.permission
          : null,
      );
    window.addEventListener("focus", refreshPermission);
    const controller = new AbortController();
    void fetch("/api/notifications", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw Error();
        const value: Settings = await response.json();
        refreshPermission();

        setData(value);
        if (value.subscribed || value.groupActivity || value.weeklyReminder) {
          setGroupActivity(value.groupActivity);
          setWeeklyReminder(value.weeklyReminder);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => {
      controller.abort();
      window.removeEventListener("focus", refreshPermission);
    };
  }, [userId]);
  async function request(body?: object, method = "POST") {
    const response = await fetch("/api/notifications", {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw Error();
    const value: Settings = await response.json();
    setData(value);
    return value;
  }
  async function save() {
    if (!data || busy) return;
    setBusy(true);
    setError(false);
    try {
      // Keep the native permission request directly in the user's click gesture (iOS requirement).
      const allowed =
        Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      setPermission(allowed);
      if (allowed !== "granted") return;
      const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const key = data.publicKey!;
      const raw = atob(
        key.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (key.length % 4)) % 4),
      );
      const applicationServerKey = Uint8Array.from(raw, (character) => character.charCodeAt(0));
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }));
      await request({ type: "subscribe", subscription: subscription.toJSON() });
      await request({
        type: "preferences",
        groupActivity,
        weeklyReminder,
        locale,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await request(undefined, "DELETE");
      const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
      await (await registration?.pushManager.getSubscription())?.unsubscribe();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const ready = !!data?.configured && supported && install.status === "installed";
  return (
    <section className="rounded-[14px] border border-edge bg-card p-5" aria-label={t("title")}>
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink">
        <Bell size={17} strokeWidth={2} className="text-primary" />
        {t("title")}
      </h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{t("description")}</p>
      <fieldset disabled={busy} className="mt-3 space-y-1 text-sm text-ink">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={groupActivity}
            onChange={(e) => setGroupActivity(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          {t("groupOption")}
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={weeklyReminder}
            onChange={(e) => setWeeklyReminder(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          {t("weeklyOption")}
        </label>
      </fieldset>
      <p className="mt-1 text-xs text-muted">{t("privacy")}</p>
      {data && !ready && (
        <p className="mt-3 text-xs text-muted">
          {t(!data.configured ? "notConfigured" : !supported ? "unsupported" : "installFirst")}
        </p>
      )}
      {permission === "denied" && <p className="mt-3 text-xs text-muted">{t("blocked")}</p>}
      {error && (
        <p role="alert" className="mt-3 text-xs text-danger">
          {t("failed")}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!ready || busy || permission === "denied"}
          onClick={() => void save()}
          className="min-h-11 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-semibold text-onprimary disabled:opacity-50"
        >
          {t(busy ? "saving" : data?.subscribed ? "save" : "enable")}
        </button>
        {data?.subscribed && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void disable()}
            className="min-h-11 rounded-[10px] border border-edge px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-50"
          >
            {t("disable")}
          </button>
        )}
      </div>
    </section>
  );
}
