import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/currentUser", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/views/repository", () => ({
  listViews: vi.fn(async () => [{ id: "v1", name: "Dining", filters: {} }]),
  createView: vi.fn(async (_u: string, name: string, filters: unknown) => ({
    id: "v1",
    name,
    filters,
  })),
  renameView: vi.fn(async () => true),
  deleteView: vi.fn(async () => true),
}));

import { getSessionUser } from "@/lib/auth/currentUser";
import { createView, deleteView, renameView } from "@/lib/views/repository";
import { GET, POST } from "./route";
import { DELETE, PATCH } from "./[id]/route";

const user = { id: "u1", name: "Sam", email: "sam@sprout.money" };
const post = (body: unknown) =>
  new Request("http://t/api/views", { method: "POST", body: JSON.stringify(body) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue(user as never);
});

describe("GET/POST /api/views", () => {
  it("401s when signed out", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(401);
  });

  it("lists views", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).views).toHaveLength(1);
  });

  it("400s a view with no name", async () => {
    const res = await POST(post({ filters: { type: "expense" } }));
    expect(res.status).toBe(400);
    expect(createView).not.toHaveBeenCalled();
  });

  it("creates a view with sanitized filters", async () => {
    const res = await POST(post({ name: "Big spends", filters: { amountMin: "50", junk: 1 } }));
    expect(res.status).toBe(200);
    // filters are sanitized (junk dropped) before persisting
    expect(createView).toHaveBeenCalledWith("u1", "Big spends", { amountMin: "50" });
  });
});

describe("PATCH/DELETE /api/views/[id]", () => {
  it("PATCH 400s without a name, 200s on rename, 404s unknown", async () => {
    expect((await PATCH(post({}), params("v1"))).status).toBe(400);
    expect((await PATCH(post({ name: "New" }), params("v1"))).status).toBe(200);
    expect(renameView).toHaveBeenCalledWith("u1", "v1", "New");
    vi.mocked(renameView).mockResolvedValueOnce(false);
    expect((await PATCH(post({ name: "New" }), params("x"))).status).toBe(404);
  });

  it("DELETE 200s then 404s when missing", async () => {
    const del = new Request("http://t", { method: "DELETE" });
    expect((await DELETE(del, params("v1"))).status).toBe(200);
    expect(deleteView).toHaveBeenCalledWith("u1", "v1");
    vi.mocked(deleteView).mockResolvedValueOnce(false);
    expect((await DELETE(del, params("x"))).status).toBe(404);
  });
});
