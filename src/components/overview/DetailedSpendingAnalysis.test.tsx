import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { DetailedSpendingAnalysis } from "./DetailedSpendingAnalysis";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/shared/OverviewSpendingInsights", () => ({
  OverviewSpendingInsights: () => <div data-advanced-analysis />,
}));
it("keeps the former Overview analysis available on demand in Trends", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<DetailedSpendingAnalysis />));
    expect(host.querySelector("[data-advanced-analysis]")).toBeNull();
    act(() => {
      const details = host.querySelector("details")!;
      details.open = true;
      details.dispatchEvent(new Event("toggle", { bubbles: true }));
    });
    expect(host.querySelector("[data-advanced-analysis]")).not.toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
