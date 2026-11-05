import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import WorkspaceLayout from "@/app/(localized)/(workspace)/layout";
import Home from "@/app/(localized)/(workspace)/home/page";
import Transactions from "@/app/(localized)/(workspace)/transactions/page";
import Groups from "@/app/(localized)/(workspace)/groups/[[...path]]/page";

const lifecycle = vi.hoisted(() => ({ mounts: 0, unmounts: 0 }));
vi.mock("@/components/AppShell", () => ({
  AppShell: function Shell() {
    useEffect(() => {
      lifecycle.mounts += 1;
      return () => {
        lifecycle.unmounts += 1;
      };
    }, []);
    return <div data-app-shell="" />;
  },
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
it("retains one app instance as route leaves change, preventing a second mount animation", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  lifecycle.mounts = 0;
  lifecycle.unmounts = 0;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <WorkspaceLayout>
        <Home />
      </WorkspaceLayout>,
    ),
  );
  const shell = container.querySelector("[data-app-shell]");
  act(() =>
    root.render(
      <WorkspaceLayout>
        <Transactions />
      </WorkspaceLayout>,
    ),
  );
  act(() =>
    root.render(
      <WorkspaceLayout>
        <Groups />
      </WorkspaceLayout>,
    ),
  );
  expect(container.querySelectorAll("[data-app-shell]")).toHaveLength(1);
  expect(container.querySelector("[data-app-shell]")).toBe(shell);
  expect(lifecycle.mounts).toBe(1);
  expect(lifecycle.unmounts).toBe(0);
});
