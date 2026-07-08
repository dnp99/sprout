import { useEffect, useRef } from "react";
import type { TxnFilter, WebView } from "@/lib/types";
import { useStore } from "@/state/store";

/** Web navigation state that we mirror into the URL so the browser back/forward
 *  buttons, refresh, and shareable deep links all work. The app is a single
 *  store-driven SPA (no route segments), so we drive `window.history` directly
 *  and reconcile on `popstate`. */

const WEB_VIEWS: WebView[] = [
  "overview",
  "transactions",
  "categories",
  "trends",
  "goals",
  "bills",
  "import",
  "settings",
];
const TXN_FILTERS: TxnFilter[] = ["all", "expense", "income", "uncategorized", "excluded"];

type NavState = { webView: WebView; webTxnType: TxnFilter; txnCategory: string };

/** Build the query string (including leading "?", or "" for the default view)
 *  for a nav state. The category/type filters are only encoded on the
 *  Transactions view, where they're meaningful. */
function buildSearch({ webView, webTxnType, txnCategory }: NavState): string {
  const params = new URLSearchParams();
  if (webView !== "overview") params.set("view", webView);
  if (webView === "transactions") {
    if (webTxnType !== "all") params.set("type", webTxnType);
    if (txnCategory !== "all") params.set("cat", txnCategory);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Parse the current URL back into a (partial) nav state, ignoring unknown
 *  values so a hand-edited URL can't wedge the app. */
function readSearch(): Partial<NavState> {
  const params = new URLSearchParams(window.location.search);
  const out: Partial<NavState> = {};
  const view = params.get("view");
  if (view && WEB_VIEWS.includes(view as WebView)) out.webView = view as WebView;
  const type = params.get("type");
  if (type && TXN_FILTERS.includes(type as TxnFilter)) out.webTxnType = type as TxnFilter;
  const cat = params.get("cat");
  if (cat) out.txnCategory = cat;
  return out;
}

export function useWebUrlSync() {
  const { webView, webTxnType, txnCategory, set } = useStore();

  // Restore state from the URL on mount (deep link / refresh), then on every
  // back/forward. Reconciling to the URL never pushes a new entry: the
  // store→URL effect below compares against the live location and finds them
  // already equal, so there's no feedback loop.
  useEffect(() => {
    const applyFromUrl = () => {
      const parsed = readSearch();
      set({
        webView: parsed.webView ?? "overview",
        webTxnType: parsed.webTxnType ?? "all",
        txnCategory: parsed.txnCategory ?? "all",
      });
    };
    // Only hydrate on mount if the URL actually carries state, so a fresh "/"
    // doesn't clobber whatever the store already has.
    if (window.location.search) applyFromUrl();
    window.addEventListener("popstate", applyFromUrl);
    return () => window.removeEventListener("popstate", applyFromUrl);
  }, [set]);

  // Push a history entry whenever the user navigates. Skip the first commit so
  // mount-time hydration (above) doesn't get overwritten before it applies.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const search = buildSearch({ webView, webTxnType, txnCategory });
    if (search !== window.location.search) {
      window.history.pushState(null, "", search || window.location.pathname);
    }
  }, [webView, webTxnType, txnCategory]);
}
