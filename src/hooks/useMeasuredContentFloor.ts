"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Retain only measured content height across views of the same data. Reset
 * when the data scope changes, so removed records never leave permanent space. */
export function useMeasuredContentFloor(scope: string, view: string, ceiling = 280) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState({ scope, height: 0 });
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => {
      const height = Math.min(ceiling, Math.ceil(content.getBoundingClientRect().height));
      setMeasured((previous) => {
        const next = previous.scope === scope ? Math.max(previous.height, height) : height;
        return previous.scope === scope && previous.height === next
          ? previous
          : { scope, height: next };
      });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(content);
    return () => observer?.disconnect();
  }, [scope, view, ceiling]);
  return { contentRef, minHeight: measured.scope === scope ? measured.height : undefined };
}
