import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { Tabs, TabList, TabPanel } from "./Tabs";
import { SelectionControl } from "./SelectionControl";

let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function render(children: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(children));
}
function Host() {
  const [value, setValue] = useState("expense");
  return (
    <Tabs value={value} onChange={setValue} stabilize>
      <TabList
        label="Budget type"
        options={[
          { value: "expense", label: "Expenses" },
          { value: "disabled", label: "Unavailable", disabled: true },
          { value: "income", label: "Income" },
        ]}
      />
      <TabPanel values={["expense", "disabled", "income"]}>{value}</TabPanel>
    </Tabs>
  );
}
it("links panels and tabs, skips disabled choices, and moves focus without scrolling", () => {
  render(<Host />);
  const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  expect(tabs[0].tabIndex).toBe(0);
  expect(tabs[2].tabIndex).toBe(-1);
  act(() => {
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  });
  expect(document.activeElement).toBe(tabs[2]);
  expect(tabs[2].getAttribute("aria-selected")).toBe("true");
  const panel = document.getElementById(tabs[2].getAttribute("aria-controls")!)!;
  expect(panel.textContent).toBe("income");
  expect(panel.getAttribute("aria-labelledby")).toBe(tabs[2].id);
  expect(container.querySelectorAll('[role="tab"][tabindex="0"]')).toHaveLength(1);
  for (const tab of tabs)
    expect(document.getElementById(tab.getAttribute("aria-controls")!)).not.toBeNull();
  act(() => tabs[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true })));
  expect(document.activeElement).toBe(tabs[0]);
  act(() => tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true })));
  expect(document.activeElement).toBe(tabs[2]);
});
it("keeps filters as pressed-button groups and preserves active-button callbacks", () => {
  const changed = vi.fn();
  render(
    <SelectionControl
      label="Period"
      value="month"
      onChange={changed}
      options={[
        { value: "month", label: "Month" },
        { value: "year", label: "Year" },
      ]}
    />,
  );
  expect(container.querySelector('[role="tablist"]')).toBeNull();
  const buttons = container.querySelectorAll("button");
  expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
  act(() => buttons[0].click());
  expect(changed).toHaveBeenCalledWith("month");
  act(() => buttons[1].click());
  expect(changed).toHaveBeenCalledWith("year");
});
it("respects RTL arrow direction", () => {
  vi.stubGlobal("getComputedStyle", () => ({ direction: "rtl" }));
  render(<Host />);
  const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  act(() => {
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  });
  expect(document.activeElement).toBe(tabs[2]);
});
it("keeps active tabs inert and a wholly disabled control non-interactive", () => {
  const change = vi.fn();
  render(
    <Tabs value="expense" onChange={change}>
      <TabList
        label="Type"
        shape="pill"
        size="compact"
        options={[
          { value: "expense", label: "Expenses" },
          { value: "income", label: "Income" },
        ]}
      />
      <TabPanel values={["expense", "income"]}>Expenses</TabPanel>
    </Tabs>,
  );
  const list = container.querySelector('[role="tablist"]')!;
  expect(list.getAttribute("data-shape")).toBe("pill");
  act(() => container.querySelector<HTMLButtonElement>("button")!.click());
  expect(change).not.toHaveBeenCalled();
  act(() =>
    root.render(
      <SelectionControl
        disabled
        label="Period"
        value="month"
        onChange={change}
        options={[
          { value: "month", label: "Month" },
          { value: "year", label: "Year" },
        ]}
      />,
    ),
  );
  act(() => container.querySelector<HTMLButtonElement>("button")!.click());
  expect(change).not.toHaveBeenCalled();
  expect([...container.querySelectorAll("button")].every((button) => button.disabled)).toBe(true);
});
