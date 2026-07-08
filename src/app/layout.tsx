import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { StoreProvider } from "@/state/store";
import "./globals.css";

// Geist is the app's single typeface (display + body) in the shadcn-hybrid
// design. Loaded as a variable font and exposed as `--font-geist`.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Sprout — Budget",
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
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
