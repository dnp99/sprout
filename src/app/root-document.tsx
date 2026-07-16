import type { Metadata, Viewport } from "next";
import "./globals.css";

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
};

export const sharedViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

// Runs before hydration to set the theme class on <html>, so the first paint
// already matches the stored/OS preference (no light-mode flash in dark mode).
const themeScript = `(function(){try{var t=localStorage.getItem('sprout-theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export function RootDocument({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
