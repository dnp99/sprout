import { appearanceScript } from "@/lib/appearance";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./controls.css";
import "./cozy-workspaces.css";

/**
 * Shared <html>/<body> shell for the two root layouts (plan 013): the
 * `(localized)` group sets `lang` from the request-resolved locale; the
 * `(public)` marketing/legal group is always English. Keeping the theme
 * bootstrap here means splitting the layouts doesn't duplicate the no-FOUC
 * logic.
 */

export const sharedMetadata: Metadata = {
  title: "Sprout - Budget",
  description: "A friendly personal budgeting app.",
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
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
