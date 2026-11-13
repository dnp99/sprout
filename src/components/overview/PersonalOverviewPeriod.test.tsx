import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { PersonalOverviewPeriod } from "./PersonalOverviewPeriod";
const capture = vi.hoisted(() => ({
  selected: "",
  set: vi.fn(),
  props: {} as {
    month: string;
    onMonthChange: (month: string) => void;
    onSelect: (month: string, date?: string) => void;
  },
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) =>
    select({ viewMonthKey: capture.selected, set: capture.set }),
}));
vi.mock("@/components/shared/ReportDateControl", () => ({
  ReportDateControl: (props: typeof capture.props) => {
    capture.props = props;
    return <button>Month</button>;
  },
}));
let root: ReturnType<typeof createRoot>, host: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  capture.set.mockClear();
  capture.selected = "";
  vi.unstubAllGlobals();
});
it("uses a selectable month control that changes the shared Personal month only, including exact-date picker callbacks", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<PersonalOverviewPeriod />));
  act(() => capture.props.onMonthChange("2026-10"));
  expect(capture.set).toHaveBeenLastCalledWith({ viewMonthKey: "2026-10" });
  act(() => capture.props.onSelect("2026-09", "2026-09-10"));
  expect(capture.set).toHaveBeenLastCalledWith({ viewMonthKey: "2026-09" });
  capture.selected = "2026-09";
  act(() => root.render(<PersonalOverviewPeriod />));
  expect(capture.props.month).toBe("2026-09");
});
