import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Element.prototype.scrollIntoView = vi.fn();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function render(onChange = vi.fn()) {
  act(() =>
    root.render(
      <Select
        value="a"
        name="category"
        aria-label="Category"
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="a" data-icon="🛒">
          Groceries
        </option>
        <option value="b" disabled>
          Unavailable
        </option>
        <option value="c" data-icon="🏠">
          Home
        </option>
      </Select>,
    ),
  );
  return container.querySelector<HTMLButtonElement>("[role=combobox]")!;
}

describe("themed select", () => {
  it("preserves native form values and fires change exactly once for pointer selection", () => {
    const changed = vi.fn();
    const trigger = render(changed);
    act(() => trigger.click());
    const options = document.querySelectorAll<HTMLButtonElement>("[role=option]");
    expect(options[1].disabled).toBe(true);
    act(() => options[2].click());
    expect(changed).toHaveBeenCalledExactlyOnceWith("c");
    expect(document.querySelector("[role=listbox]")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it("skips disabled options with keyboard and closes on Escape without bubbling", () => {
    const changed = vi.fn();
    const trigger = render(changed);
    const key = (value: string) =>
      act(() => {
        trigger.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true }));
      });
    key("ArrowDown");
    key("ArrowDown");
    key("Enter");
    expect(changed).toHaveBeenCalledExactlyOnceWith("c");
    act(() => trigger.click());
    key("Escape");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
