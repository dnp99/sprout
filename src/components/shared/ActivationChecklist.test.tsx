import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActivationChecklist, type ActivationItem } from "./ActivationChecklist";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
const items: ActivationItem[] = [
  { key: "budget", label: "Budget", required: true, done: true, onClick() {} },
  { key: "txn", label: "Transaction", required: true, done: true, onClick() {} },
  { key: "goal", label: "Goal", done: false, onClick() {} },
];
describe("activation panel visibility", () => {
  it("removes completed core onboarding from Home even with optional tasks left", () => {
    expect(renderToStaticMarkup(<ActivationChecklist items={items} />)).toBe("");
  });
  it("retains the expanded actionable checklist in Settings", () => {
    const html = renderToStaticMarkup(
      <ActivationChecklist items={items} hideWhenComplete={false} initiallyExpanded />,
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("Goal");
    expect(html).toContain("youreSet");
  });
  it("continues guiding accounts with an incomplete required step", () => {
    expect(
      renderToStaticMarkup(
        <ActivationChecklist items={items.map((item) => ({ ...item, done: false }))} />,
      ),
    ).toContain("getStarted");
  });
  it("keeps learning visible until explicitly acknowledged", () => {
    const learning: ActivationItem = {
      key: "capture",
      label: "Voice & text",
      done: false,
      required: true,
      onClick() {},
      onComplete() {},
    };
    const html = renderToStaticMarkup(<ActivationChecklist items={[...items, learning]} />);
    expect(html).toContain("gotIt");
    expect(html).toContain("Voice &amp; text");
    expect(
      renderToStaticMarkup(<ActivationChecklist items={[...items, { ...learning, done: true }]} />),
    ).toBe("");
  });
});
