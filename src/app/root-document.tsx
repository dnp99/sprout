import { PwaRuntime } from "@/components/settings/PwaRuntime";
import { appearanceScript, DEFAULT_VISUAL_THEME } from "@/lib/appearance";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./controls.css";
import "./cozy-workspaces.css";
import "./date-controls.css";
import "./cozy-palette.css";
import "./cozy-colors.css";
import "./transaction-dialog.css";
import "./vibrant-theme.css";
import "./desktop-transactions.css";
import "./elegant-desktop-surfaces.css";
import "./ledger-search.css";
import "./group-transactions.css";
import "./loading-indicator.css";
import "./elegant-dark.css";
import "./typography.css";
import "./account-settings.css";
import "./budget-tabs.css";
import "./selection-controls.css";
import "./mobile-app.css";
import "./context-switch.css";

const installCaptureScript = `(()=>{const w=window;if(w.__sproutPwaCaptureInstalled)return;w.__sproutPwaCaptureInstalled=true;w.addEventListener("beforeinstallprompt",e=>{if(!w.__sproutPwaControllerReady){e.preventDefault();w.__sproutPwaDeferred=e}})})();`;

/**
 * Shared <html>/<body> shell for the two root layouts (plan 013): the
 * `(localized)` group sets `lang` from the request-resolved locale; the
 * `(public)` marketing/legal group is always English. Keeping the theme
 * bootstrap here means splitting the layouts doesn't duplicate the no-FOUC
 * logic.
 */

export const sharedMetadata: Metadata = {
  title: "Sprout - Budget",
  description: "Friendly budgeting for personal and shared finances.",
  applicationName: "Sprout",
  appleWebApp: {
    capable: true,
    title: "Sprout",
    statusBarStyle: "default",
  },
};

export const sharedViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export function RootDocument({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    <html
      lang={lang}
      data-visual-theme={DEFAULT_VISUAL_THEME}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
        <script dangerouslySetInnerHTML={{ __html: installCaptureScript }} />
      </head>
      <body className="font-sans">
        <PwaRuntime />
        {children}
      </body>
    </html>
  );
}
