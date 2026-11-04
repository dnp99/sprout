import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { GroupChooser } from "./GroupChooser";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
it("offers switching only for multiple groups and preserves the selected route", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  const root = createRoot(container);
  const onChange = vi.fn();
  const groups = [
    { id: "maple", name: "Maple House" },
    { id: "cedar", name: "Cedar House" },
  ];
  try {
    act(() =>
      root.render(
        <GroupChooser
          id="maple"
          groups={groups.slice(0, 1)}
          disabled={false}
          onChange={onChange}
        />,
      ),
    );
    expect(container.querySelector("select")).toBeNull();
    act(() =>
      root.render(<GroupChooser id="maple" groups={groups} disabled={false} onChange={onChange} />),
    );
    const select = container.querySelector("select")!;
    expect(select.value).toBe("maple");
    act(() => {
      select.value = "cedar";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith("cedar");
    act(() =>
      root.render(<GroupChooser id="maple" groups={groups} disabled onChange={onChange} />),
    );
    expect(select.disabled).toBe(true);
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});
