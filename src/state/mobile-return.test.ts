import { expect, it } from "vitest";
import { createAppStore } from "./create-store";
it("keeps record and category editor origins scoped to their originating screen", () => {
  const store = createAppStore({ mobileScreen: "home" });
  store.getState().openTransaction("record-a");
  expect(store.getState().txnReturnTo).toBe("home");
  store.getState().openTransaction("record-b");
  expect(store.getState().txnReturnTo).toBe("home");
  store.getState().goMobile("search");
  store.getState().openTransaction("record-c");
  expect(store.getState().txnReturnTo).toBe("search");
  store.getState().goMobile("home");
  store.getState().openCategory("category-a");
  expect(store.getState().categoryReturnTo).toBe("home");
});
