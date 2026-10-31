import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from "vitest";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, closeDb } from "@/db";
import {
  notificationJobs as jobs,
  pushSubscriptions,
  notificationPreferences as prefs,
  sessions,
  users,
  groups,
} from "@/db/schema";
import { fixture, entry, mutate, snapshot } from "@/lib/groups/integration-fixtures";
import { createSession, revokeSession } from "@/lib/auth/sessionRepository";
import { subscribe, savePreferences } from "./repository";
import { dispatchNotifications, queueWeeklyReminders } from "./delivery";
const send = vi.hoisted(() => vi.fn().mockResolvedValue({ statusCode: 201 }));
vi.mock("web-push", () => ({ default: { sendNotification: send } }));
const url = process.env.GROUP_TEST_DATABASE_URL;
describe.skipIf(!url)("push delivery in isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!url || !/^\/sprout_groups_test_\d+$/.test(new URL(url).pathname))
      throw Error("Refusing non-test database");
    await closeDb();
    process.env.DATABASE_URL = url;
    vi.stubEnv("VAPID_PUBLIC_KEY", "test");
    vi.stubEnv("VAPID_PRIVATE_KEY", "test");
    vi.stubEnv("VAPID_SUBJECT", "mailto:test@example.test");
  });
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ statusCode: 201 });
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    await closeDb();
  });
  async function device(userId: string) {
    const session = await createSession(userId),
      db = getDb();
    const [row] = await db.select().from(sessions).where(eq(sessions.token, session.token));
    await savePreferences(userId, {
      groupActivity: true,
      weeklyReminder: true,
      locale: "en-CA",
      timeZone: "America/Toronto",
    });
    await subscribe(userId, row.id, {
      endpoint: `https://fcm.googleapis.com/fcm/send/${randomUUID()}`,
      p256dh: "B".repeat(87),
      auth: "a".repeat(22),
    });
    const [sub] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.sessionId, row.id));
    return { ...session, id: sub.id, sessionId: row.id };
  }
  it("queues only other opted-in members and sends actor/group/amount/merchant details only to other members after commit", async () => {
    const f = await fixture(),
      a = await device(f.a),
      b = await device(f.b);
    await getDb().update(users).set({ name: "Alex" }).where(eq(users.id, f.a));
    await getDb().update(groups).set({ name: "Maple House" }).where(eq(groups.id, f.g));
    await entry(f, { payerId: f.bm }, false);
    const pending = await getDb()
      .select()
      .from(jobs)
      .where(and(eq(jobs.groupId, f.g), isNull(jobs.completedAt)));
    expect(pending.map((j) => j.subscriptionId)).toEqual([b.id]);
    expect(pending.some((j) => j.subscriptionId === a.id)).toBe(false);
    await dispatchNotifications();
    const call =
      send.mock.calls.find(([s]) => s.endpoint.endsWith(b.id)) ??
      send.mock.calls.find(([, payload]) => JSON.parse(payload).url.includes(f.g));
    expect(call).toBeTruthy();
    const payload = JSON.parse(call![1]);
    expect(payload.title).toBe("Maple House");
    expect(payload.body).toBe("Alex added an expense of $120.00 at Groceries.");
    expect(payload.url).toBe(`/groups/${f.g}/transactions`);
    expect(
      (await getDb().select().from(jobs).where(eq(jobs.id, pending[0].id)))[0].completedAt,
    ).not.toBeNull();
    await dispatchNotifications();
    expect(send.mock.calls.filter(([, p]) => JSON.parse(p).tag === pending[0].id)).toHaveLength(1);
  });
  it("suppresses delivery after membership removal or consent revocation", async () => {
    const f = await fixture(),
      b = await device(f.b);
    await entry(f, {}, false);
    await mutate(f.a, f.g, { type: "remove", id: f.bm });
    await dispatchNotifications();
    expect(send.mock.calls.some(([, p]) => JSON.parse(p).url.includes(f.g))).toBe(false);
    expect(
      (await getDb().select().from(jobs).where(eq(jobs.subscriptionId, b.id)))[0].completedAt,
    ).not.toBeNull();
    const other = await fixture();
    await device(other.b);
    await entry(other, {}, false);
    await getDb().update(prefs).set({ groupActivity: false }).where(eq(prefs.userId, other.b));
    await dispatchNotifications();
    expect(send.mock.calls.some(([, p]) => JSON.parse(p).url.includes(other.g))).toBe(false);
  });
  it("cascades device and queued jobs on logout and ignores expired sessions", async () => {
    const f = await fixture(),
      b = await device(f.b);
    await entry(f, {}, false);
    await revokeSession(b.token);
    expect(
      await getDb().select().from(pushSubscriptions).where(eq(pushSubscriptions.id, b.id)),
    ).toHaveLength(0);
    expect(await getDb().select().from(jobs).where(eq(jobs.subscriptionId, b.id))).toHaveLength(0);
    const d = await device(f.b);
    await getDb()
      .update(sessions)
      .set({ expiresAt: new Date(0) })
      .where(eq(sessions.id, d.sessionId));
    await entry(f, {}, false);
    expect(await getDb().select().from(jobs).where(eq(jobs.subscriptionId, d.id))).toHaveLength(0);
  });
  it("deduplicates the weekly reminder per device and local Sunday, then cleans expired endpoints", async () => {
    const f = await fixture(),
      b = await device(f.b);
    const sunday = new Date("2026-11-02T00:07:00Z");
    await queueWeeklyReminders(sunday);
    await queueWeeklyReminders(sunday);
    const pending = await getDb()
      .select()
      .from(jobs)
      .where(and(eq(jobs.subscriptionId, b.id), eq(jobs.kind, "weekly")));
    expect(pending).toHaveLength(1);
    send.mockRejectedValue({ statusCode: 410 });
    await dispatchNotifications();
    expect(
      await getDb().select().from(pushSubscriptions).where(eq(pushSubscriptions.id, b.id)),
    ).toHaveLength(0);
  });
  it("does not enqueue another alert when editing the same saved entry", async () => {
    const f = await fixture(),
      b = await device(f.b),
      saved = await entry(f, {}, false);
    const s = await snapshot(f.a, f.g),
      e = s.entries.find((e) => e.id === saved.id)!;
    await entry(f, { id: e.id, version: e.version, merchant: "Updated" }, false);
    expect(
      await getDb()
        .select()
        .from(jobs)
        .where(and(eq(jobs.subscriptionId, b.id), eq(jobs.groupId, f.g))),
    ).toHaveLength(1);
  });
  it("suppresses a queued notification when its entry is voided before delivery", async () => {
    const f = await fixture();
    await device(f.b);
    const saved = await entry(f, {}, false);
    await mutate(f.a, f.g, { type: "void", id: saved.id, version: 0, reason: "Duplicate" });
    await dispatchNotifications();
    expect(send.mock.calls.some(([, p]) => JSON.parse(p).url.includes(f.g))).toBe(false);
  });
  it("resolves existing import/copy audit events into one localized batch summary", async () => {
    const f = await fixture(),
      b = await device(f.b);
    const { activity } = await import("@/lib/groups/context");
    await getDb().transaction(async (tx) => {
      await activity(tx, f.g, f.am, "imported", f.g, { imported: 12 });
      await activity(tx, f.g, f.am, "bulkCopied", null, { count: 2 });
    });
    await dispatchNotifications();
    const payloads = send.mock.calls
      .map(([, p]) => JSON.parse(p))
      .filter((p) => p.url.includes(f.g));
    expect(payloads.map((p) => p.body)).toEqual(
      expect.arrayContaining([
        "Member imported 12 transactions.",
        "Member copied 2 transactions into this group.",
      ]),
    );
    expect(payloads).toHaveLength(2);
    expect(await getDb().select().from(jobs).where(eq(jobs.subscriptionId, b.id))).toHaveLength(2);
  });
});
