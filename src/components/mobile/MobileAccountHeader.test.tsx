import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { MobileAccountHeader } from "./MobileAccountHeader";
import { MobileHeader } from "./MobileHeader";
import { GroupAccountHeader } from "@/components/groups/GroupAccountHeader";
import type { MobileScreen } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string, values?: { name?: string }) =>
    key === "home.greeting" ? `Hi, ${values?.name}` : namespace ? `${namespace}.${key}` : key,
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) =>
    select({
      user: { name: "Alex", greetingName: "Alex" },
      trendPeriod: "month",
      trendView: "spending",
      set: vi.fn(),
    }),
}));
vi.mock("@/components/settings/AccountSettings", () => ({ AccountSettings: () => null }));
vi.mock("@/components/shared/MonthStepper", () => ({ MonthStepper: () => <button>month</button> }));
vi.mock("@/components/shared/TrendPeriodToggle", () => ({
  TrendPeriodToggle: () => <button>period</button>,
}));
vi.mock("@/components/shared/CashFlowMonthStepper", () => ({
  CashFlowMonthStepper: () => <button>cashflow month</button>,
}));
vi.mock("@/components/shared/TransactionTools", () => ({
  TransactionTools: () => <button>transaction tools</button>,
}));
let root: ReturnType<typeof createRoot>, host: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  vi.unstubAllGlobals();
});
const tabs = [
  ["history", "transactions", "transactions"],
  ["categories", "budget", "budget"],
  ["goals", "goals", "goals"],
  ["trends", "trends", "trends"],
  ["settings", "settings", "settings"],
] as const;
it.each(tabs)("uses one page identity for Personal %s and Group %s", (screen, section, title) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  for (const group of [false, true]) {
    act(() =>
      root.render(
        group ? (
          <GroupAccountHeader
            section={section}
            id="maple"
            name="Maple House"
            groups={[
              { id: "maple", name: "Maple House" },
              { id: "cedar", name: "Cedar House" },
            ]}
            disabled={false}
            onChange={vi.fn()}
          />
        ) : (
          <>
            <MobileAccountHeader screen={screen} />
            <MobileHeader screen={screen} />
          </>
        ),
      ),
    );
    expect(host.querySelectorAll("h1")).toHaveLength(1);
    expect(host.querySelector("h1")?.textContent).toBe(`nav.${title}`);
    expect(host.querySelector(".account-greeting")).toBeNull();
    expect(host.querySelector(".transaction-space-badge")).not.toBeNull();
    expect(host.querySelector('[aria-label="titles.settings"]')).not.toBeNull();
    if (group)
      expect(
        host.querySelector('[role="combobox"][aria-label="groups.chooseGroup"]'),
      ).not.toBeNull();
  }
});
it.each([false, true])("keeps the greeting on Home (group=%s)", (group) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() =>
    root.render(
      group ? (
        <GroupAccountHeader
          section="overview"
          name="Maple House"
          groups={[]}
          disabled={false}
          onChange={vi.fn()}
        />
      ) : (
        <MobileAccountHeader screen={"home" as MobileScreen} />
      ),
    ),
  );
  expect(host.querySelector("h1")?.textContent).toBe("Hi, Alex");
  expect(host.querySelector(".transaction-page-identity")).toBeNull();
});
