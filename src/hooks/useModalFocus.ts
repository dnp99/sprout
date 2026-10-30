"use client";
import { useEffect, useRef, type RefObject } from "react";

const stack: symbol[] = [];
let originalOverflow = "";

/** One focus/scroll boundary for shared editors, instructions and group dialogs. */
export function useModalFocus(ref: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const token = Symbol();
    if (!stack.length) originalOverflow = document.body.style.overflow;
    stack.push(token);
    document.body.style.overflow = "hidden";
    const previous = document.activeElement as HTMLElement | null;
    const controls = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
        ) ?? [],
      ).filter((e) => e.getClientRects().length);
    controls()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || stack[stack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const list = controls(),
          first = list[0],
          last = list[list.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      const wasTop = stack[stack.length - 1] === token;
      const index = stack.indexOf(token);
      if (index >= 0) stack.splice(index, 1);
      if (!stack.length) document.body.style.overflow = originalOverflow;
      if (wasTop && previous?.isConnected) previous.focus();
    };
  }, [ref]);
}
