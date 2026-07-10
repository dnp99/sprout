"use client";

import type { ReactNode } from "react";

/**
 * In-page anchor link for the landing nav. Smooth-scrolls to the target section
 * **without** pushing a browser history entry.
 *
 * Native `<a href="#section">` hash jumps add history entries the Next.js App
 * Router doesn't own. Mixing them with a `Link` route change (e.g. landing →
 * `/login`) confuses the router's back navigation — pressing Back would land on
 * `/#section` but keep the *previous* route mounted (the login page), instead of
 * re-rendering the landing. Scrolling in JS and skipping the history push avoids
 * that. `scrollIntoView()` with no explicit behavior inherits the CSS
 * `scroll-behavior` (smooth, and gated on prefers-reduced-motion in globals.css).
 */
export function AnchorLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (!href.startsWith("#")) return;
        e.preventDefault();
        const id = href.slice(1);
        const el = id ? document.getElementById(id) : null;
        if (el) el.scrollIntoView();
        else window.scrollTo({ top: 0 });
      }}
    >
      {children}
    </a>
  );
}
