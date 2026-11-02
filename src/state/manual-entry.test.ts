import { beforeEach, expect, it, vi } from "vitest";
import { createAppStore } from "./create-store";

const mocks = vi.hoisted(() => ({ post: vi.fn(), load: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  postTransaction: mocks.post,
}));
vi.mock("./personal-loader", () => ({ createPersonalLoader: () => ({ load: mocks.load }) }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockImplementation(async (input) => ({ id: "saved", ...input }));
});
it("blocks a missing category even when Personal commitAdd is called directly", async () => {
  const store = createAppStore({
    addMerchant: "Maple Market",
    addAmountCents: 1200,
    addCategoryId: "",
  });
  await store.getState().commitAdd();
  expect(mocks.post).not.toHaveBeenCalled();
});
it("sends the selected category for Personal income and clears it on a fresh draft", async () => {
  const store = createAppStore({
    addMode: "income",
    addMerchant: "Design project",
    addAmountCents: 2500,
    addCategoryId: "design",
    addNote: "Project deposit",
  });
  await store.getState().commitAdd();
  expect(mocks.post).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: "income",
      amountCents: 2500,
      categoryId: "design",
      note: "Project deposit",
    }),
  );
  store.getState().resetAdd();
  expect(store.getState().addCategoryId).toBe("");
  expect(store.getState().addNote).toBe("");
});
