import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { PersonalCalendar } from "./PersonalCalendar";
const capture = vi.hoisted(() => ({
  props: {} as { month: string; onMonthChange: (month: string) => void; onViewAll: () => void },
  set: vi.fn(),
  mobile: vi.fn(),
}));
vi.mock("./EverydayCalendar", () => ({
  EverydayCalendar: (props: typeof capture.props) => {
    capture.props = props;
    return <div />;
  },
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (state: unknown) => unknown) =>
    select({
      transactions: [],
      transactionsLoading: false,
      set: capture.set,
      goMobile: capture.mobile,
      openTransaction: vi.fn(),
    }),
}));
let root: ReturnType<typeof createRoot>, host: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  capture.set.mockClear();
  capture.mobile.mockClear();
  vi.unstubAllGlobals();
});
it.each([false, true])(
  "opens the displayed calendar month with clean transaction filters (mobile=%s)",
  (compact) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<PersonalCalendar compact={compact} dashboard />));
    act(() => capture.props.onMonthChange("2028-02"));
    act(() => capture.props.onViewAll());
    expect(capture.set).toHaveBeenCalledWith(
      expect.objectContaining({
        viewMonthKey: "2028-02",
        webDateFrom: "2028-02-01",
        webDateTo: "2028-02-29",
        searchDateFrom: "2028-02-01",
        searchDateTo: "2028-02-29",
        webTxnType: "all",
        webTxnQuickType: "all",
        mobileTxnScope: "all",
        txnCategory: "all",
        txnBusinessId: "all",
      }),
    );
    expect(capture.set.mock.calls[0][0]).not.toHaveProperty("trendPeriod");
    if (compact) expect(capture.mobile).toHaveBeenCalledWith("history");
    else expect(capture.set).toHaveBeenCalledWith({ webView: "transactions" });
  },
);
it("accepts ledger-owned months through the supplied change callback", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const change = vi.fn();
  act(() => root.render(<PersonalCalendar dashboard month="2026-09" onMonthChange={change} />));
  expect(capture.props.month).toBe("2026-09");
  act(() => capture.props.onMonthChange("2026-08"));
  expect(change).toHaveBeenCalledWith("2026-08");
  expect(capture.set).not.toHaveBeenCalled();
  act(() => root.render(<PersonalCalendar dashboard month="2026-08" onMonthChange={change} />));
  expect(capture.props.month).toBe("2026-08");
});
