import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/currentUser", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/rules/repository", () => ({
  listRules: vi.fn(async () => [{ id: "r1", label: "Uber", pattern: "UBER" }]),
  upsertManualRule: vi.fn(async () => ({ id: "r1", pattern: "UBER" })),
  updateRuleCategory: vi.fn(async () => ({ pattern: "UBER" })),
  deleteRule: vi.fn(async () => true),
  applyRuleToExisting: vi.fn(async () => 3),
}));

import { getSessionUser } from "@/lib/auth/currentUser";
import {
  applyRuleToExisting,
  deleteRule,
  updateRuleCategory,
  upsertManualRule,
} from "@/lib/rules/repository";
import { GET, POST } from "./route";
import { DELETE, PATCH } from "./[id]/route";

const user = { id: "u1", name: "Sam", email: "sam@sprout.money" };
const post = (url: string, body: unknown) =>
  new Request(url, { method: "POST", body: JSON.stringify(body) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue(user as never);
});

describe("GET /api/rules", () => {
  it("401s when signed out; lists rules when signed in", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(401);
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).rules).toHaveLength(1);
  });
});

describe("POST /api/rules", () => {
  it("400s without a merchant or category", async () => {
    expect((await POST(post("http://t/api/rules", { categoryId: "c1" }))).status).toBe(400);
    expect((await POST(post("http://t/api/rules", { merchant: "Uber" }))).status).toBe(400);
    expect(upsertManualRule).not.toHaveBeenCalled();
  });

  it("400s a too-generic merchant (empty pattern)", async () => {
    vi.mocked(upsertManualRule).mockResolvedValueOnce(null);
    const res = await POST(post("http://t/api/rules", { merchant: "123", categoryId: "c1" }));
    expect(res.status).toBe(400);
  });

  it("creates the rule and applies it when asked", async () => {
    const res = await POST(
      post("http://t/api/rules", { merchant: "Uber", categoryId: "c1", apply: true }),
    );
    expect(res.status).toBe(200);
    expect(upsertManualRule).toHaveBeenCalledWith("u1", "Uber", "c1");
    expect(applyRuleToExisting).toHaveBeenCalledWith("u1", "UBER", "c1");
    expect(await res.json()).toMatchObject({ id: "r1", applied: 3 });
  });

  it("does not apply when not asked", async () => {
    await POST(post("http://t/api/rules", { merchant: "Uber", categoryId: "c1" }));
    expect(applyRuleToExisting).not.toHaveBeenCalled();
  });
});

describe("PATCH/DELETE /api/rules/[id]", () => {
  it("PATCH 400s without a category, 200s and can apply", async () => {
    expect((await PATCH(post("http://t", {}), params("r1"))).status).toBe(400);
    const res = await PATCH(post("http://t", { categoryId: "c2", apply: true }), params("r1"));
    expect(res.status).toBe(200);
    expect(updateRuleCategory).toHaveBeenCalledWith("u1", "r1", "c2");
    expect(applyRuleToExisting).toHaveBeenCalledWith("u1", "UBER", "c2");
  });

  it("PATCH 404s an unknown rule", async () => {
    vi.mocked(updateRuleCategory).mockResolvedValueOnce(null);
    const res = await PATCH(post("http://t", { categoryId: "c2" }), params("nope"));
    expect(res.status).toBe(404);
  });

  it("DELETE removes the rule (404 when missing)", async () => {
    const res = await DELETE(new Request("http://t", { method: "DELETE" }), params("r1"));
    expect(res.status).toBe(200);
    expect(deleteRule).toHaveBeenCalledWith("u1", "r1");

    vi.mocked(deleteRule).mockResolvedValueOnce(false);
    const missing = await DELETE(new Request("http://t", { method: "DELETE" }), params("x"));
    expect(missing.status).toBe(404);
  });
});
