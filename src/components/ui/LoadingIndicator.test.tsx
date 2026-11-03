import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoadingIndicator } from "./LoadingIndicator";

describe("LoadingIndicator", () => {
  it("announces standalone loading while leaving the logo decorative", () => {
    const markup = renderToStaticMarkup(<LoadingIndicator label="Loading" />);
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Loading"');
    expect(markup).toContain('aria-hidden="true"');
  });

  it("hides the mark from assistive technology beside existing status text", () => {
    const markup = renderToStaticMarkup(<LoadingIndicator size={16} />);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('role="status"');
  });
});
