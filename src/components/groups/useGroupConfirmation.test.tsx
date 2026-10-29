import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useGroupConfirmation } from "./useGroupConfirmation";
import { GroupDialog } from "./ui";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function start() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const saved = vi.fn(),
    closed = vi.fn(),
    native = vi.spyOn(window, "confirm");
  function Editor() {
    const { confirm, confirmation } = useGroupConfirmation();
    return (
      <GroupDialog title="Editor" onClose={closed}>
        {confirmation}
        <input defaultValue="Draft" aria-label="Draft" />
        <button
          onClick={async () => {
            if (await confirm("Discard draft?")) saved();
          }}
        >
          Ask
        </button>
      </GroupDialog>
    );
  }
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Editor />));
  const ask = [...container.querySelectorAll("button")].find((b) => b.textContent === "Ask")!;
  ask.focus();
  act(() => ask.click());
  return { saved, closed, native, ask };
}
function button(label: string) {
  return [...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')].find(
    (b) => b.textContent === label,
  )!;
}
it("portals above the scrolling editor, cancels without losing the draft, and restores focus", async () => {
  const { saved, native, ask } = start();
  expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  expect(document.activeElement).toBe(button("cancel"));
  await act(async () => button("cancel").click());
  expect(saved).not.toHaveBeenCalled();
  expect(native).not.toHaveBeenCalled();
  expect(container.querySelector("input")?.value).toBe("Draft");
  expect(document.activeElement).toBe(ask);
});
it("Escape cancels only the confirmation and traps Tab inside it", async () => {
  const { saved, closed } = start();
  act(() =>
    button("cancel").dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }),
    ),
  );
  expect(document.activeElement).toBe(button("confirmAction"));
  await act(async () =>
    button("confirmAction").dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    ),
  );
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  expect(saved).not.toHaveBeenCalled();
  expect(closed).not.toHaveBeenCalled();
});
it("performs the awaited action once after confirmation", async () => {
  const { saved, native } = start();
  await act(async () => button("confirmAction").click());
  expect(saved).toHaveBeenCalledTimes(1);
  expect(native).not.toHaveBeenCalled();
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
});
