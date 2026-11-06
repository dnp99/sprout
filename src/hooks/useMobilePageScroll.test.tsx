import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useMobilePageScroll } from "./useMobilePageScroll";
vi.mock("next/navigation", () => ({ usePathname: () => window.location.pathname }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
function Host({
  page,
  detail = false,
  enabled = true,
  ready = true,
}: {
  page: string;
  detail?: boolean;
  enabled?: boolean;
  ready?: boolean;
}) {
  const ref = useMobilePageScroll(page, detail, enabled, ready);
  return <div ref={ref} style={{ scrollBehavior: "smooth" }} />;
}
beforeEach(() => {
  window.history.replaceState(null, "", "/initial");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function render(page: string, detail = false, ready = true, enabled = true) {
  if (window.location.pathname !== `/${page}`) window.history.pushState(null, "", `/${page}`);
  act(() => root.render(<Host page={page} detail={detail} ready={ready} enabled={enabled} />));
}
function scroll(top: number) {
  const viewport = container.firstElementChild as HTMLElement;
  viewport.scrollTop = top;
  viewport.dispatchEvent(new Event("scroll"));
}
it("retains refresh offsets, restores a detail return and resets genuinely new tabs", () => {
  render("transactions");
  scroll(2400);
  render("transactions", false, false);
  render("transactions");
  expect(container.firstElementChild!.scrollTop).toBe(2400);
  render("category", true);
  expect(container.firstElementChild!.scrollTop).toBe(0);
  scroll(80);
  render("transactions");
  expect(container.firstElementChild!.scrollTop).toBe(2400);
  expect((container.firstElementChild as HTMLElement).dataset.mobileDirection).toBe("back");
  render("home");
  expect(container.firstElementChild!.scrollTop).toBe(0);
  expect((container.firstElementChild as HTMLElement).style.scrollBehavior).toBe("smooth");
});
it("restores browser Back once data is ready and leaves desktop untouched", () => {
  render("transactions");
  const transactionEntry = window.history.state;
  scroll(1600);
  render("settings");
  scroll(50);
  window.history.replaceState(transactionEntry, "", "/transactions");
  window.dispatchEvent(new PopStateEvent("popstate"));
  render("transactions", false, false);
  render("transactions");
  expect(container.firstElementChild!.scrollTop).toBe(1600);
  render("desktop", false, true, false);
  expect(container.firstElementChild!.scrollTop).toBe(1600);
});
it("does not mistake hash-only panel Back for a later tab return", () => {
  render("transactions");
  scroll(800);
  render("settings");
  window.history.replaceState(null, "", "/settings#settings-categories");
  window.dispatchEvent(new PopStateEvent("popstate"));
  render("transactions");
  expect(container.firstElementChild!.scrollTop).toBe(0);
});
it("restores when a route listener renders before other popstate listeners", () => {
  const routeListener = () => render("transactions");
  window.addEventListener("popstate", routeListener);
  render("transactions");
  const transactionEntry = window.history.state;
  scroll(1200);
  render("home");
  window.history.replaceState(transactionEntry, "", "/transactions");
  window.dispatchEvent(new PopStateEvent("popstate"));
  expect(container.firstElementChild!.scrollTop).toBe(1200);
  window.removeEventListener("popstate", routeListener);
});
it("tracks a URL commit that follows the screen change", () => {
  render("transactions");
  const transactionEntry = window.history.state;
  scroll(1800);
  act(() => root.render(<Host page="home" />));
  window.history.replaceState(null, "", "/home");
  act(() => root.render(<Host page="home" />));
  window.history.replaceState(transactionEntry, "", "/transactions");
  // Next may commit its path before the external store catches up.
  act(() => root.render(<Host page="home" />));
  window.dispatchEvent(new PopStateEvent("popstate"));
  render("transactions");
  expect(container.firstElementChild!.scrollTop).toBe(1800);
});
it("does not carry same-screen query history restoration into the next tab tap", () => {
  render("home");
  scroll(300);
  render("transactions");
  const firstEntry = window.history.state;
  window.history.pushState(null, "", "/transactions?cat=sample");
  render("transactions");
  window.history.replaceState(firstEntry, "", "/transactions");
  render("transactions");
  render("home");
  expect(container.firstElementChild!.scrollTop).toBe(0);
});

it("resets a same-route ledger scope once and retains its offset during refresh", () => {
  render("transactions");
  const show = (page: string, ready = true) =>
    act(() => root.render(<Host page={page} ready={ready} />));
  show("transactions:november:all");
  scroll(1800);
  show("transactions:november:all");
  expect(container.firstElementChild!.scrollTop).toBe(1800);
  show("transactions:october:all", false);
  show("transactions:october:all", true);
  expect(container.firstElementChild!.scrollTop).toBe(0);
  scroll(600);
  show("transactions:october:all", false);
  show("transactions:october:all", true);
  expect(container.firstElementChild!.scrollTop).toBe(600);
});
