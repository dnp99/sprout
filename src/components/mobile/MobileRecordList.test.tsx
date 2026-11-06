import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { MobileRecordList } from "./MobileRecordList";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
it("bounds initial rendering and retains loaded rows when returning to a long list", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const rows = Array.from({ length: 1000 }, (_, index) => index);
  let root = createRoot(container);
  const render = () =>
    act(() =>
      root.render(
        <MobileRecordList
          scope="long-list-test"
          items={rows}
          renderItem={(row) => (
            <div data-record key={row}>
              {row}
            </div>
          )}
        />,
      ),
    );
  try {
    render();
    expect(container.querySelectorAll("[data-record]")).toHaveLength(60);
    act(() => container.querySelector("button")!.click());
    expect(container.querySelectorAll("[data-record]")).toHaveLength(120);
    act(() => root.unmount());
    root = createRoot(container);
    render();
    expect(container.querySelectorAll("[data-record]")).toHaveLength(120);
    expect(rows).toHaveLength(1000);
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});

it("retains batches on mutation but resets a different query without requiring a caller key", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  const root = createRoot(container);
  let rows = Array.from({ length: 200 }, (_, index) => index);
  const render = (scope: string) =>
    act(() =>
      root.render(
        <MobileRecordList
          scope={scope}
          items={rows}
          renderItem={(row) => (
            <div data-record key={row}>
              {row}
            </div>
          )}
        />,
      ),
    );
  try {
    render("mutation-query");
    act(() => container.querySelector("button")!.click());
    rows = [-1, ...rows];
    render("mutation-query");
    expect(container.querySelectorAll("[data-record]")).toHaveLength(120);
    render("another-query");
    expect(container.querySelectorAll("[data-record]")).toHaveLength(60);
    render("mutation-query");
    expect(container.querySelectorAll("[data-record]")).toHaveLength(120);
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});
