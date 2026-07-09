import type { Metadata, Viewport } from "next";
import { StoreProvider } from "@/state/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprout - Budget",
  description: "A friendly personal budgeting app.",
};

export const viewport: Viewport = {
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
