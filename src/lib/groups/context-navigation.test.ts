import { expect, it } from "vitest";
import {
  contextSection,
  groupContextPath,
  personalContextPath,
  soleGroupDestination,
} from "./context-navigation";
it("preserves transaction, trends and goals when changing financial context", () => {
  for (const section of ["transactions", "trends", "goals", "settings"]) {
    expect(groupContextPath("group-id", contextSection(`/${section}`))).toBe(
      `/groups/group-id/${section}`,
    );
    expect(personalContextPath(contextSection(`/groups/group-id/${section}`))).toBe(`/${section}`);
  }
});
it("maps personal categories to group budget in both directions", () => {
  expect(groupContextPath("id", contextSection("/categories"))).toBe("/groups/id/budget");
  expect(personalContextPath(contextSection("/groups/id/budget"))).toBe("/categories");
});
it("retains the requested section while choosing a group", () => {
  expect(groupContextPath(undefined, "transactions")).toBe("/groups?section=transactions");
  expect(groupContextPath("id", contextSection("/groups", "transactions"))).toBe(
    "/groups/id/transactions",
  );
  expect(contextSection("/groups", "https://evil.test")).toBe("overview");
});

it("opens one group directly while retaining explicit management and invitations", () => {
  const groups = [{ id: "only" }];
  expect(soleGroupDestination(groups, "overview")).toBe("/groups/only");
  expect(soleGroupDestination(groups, "transactions")).toBe("/groups/only/transactions");
  expect(soleGroupDestination(groups, "overview", true)).toBeNull();
  expect(soleGroupDestination(groups, "overview", false, true)).toBeNull();
  expect(soleGroupDestination([], "overview")).toBeNull();
  expect(soleGroupDestination([{ id: "a" }, { id: "b" }], "overview")).toBeNull();
});
