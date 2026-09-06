"use client";

import { useEffect, useRef } from "react";

/** A small controlled popover boundary. Every menu uses the same pointer-away
 * and Escape dismissal rules, while callers retain control of trigger and
 * placement so it fits the surrounding layout. */
export function Popover({
  open,
  onClose,
  className = "relative",
  children,
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeWhenOutside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
