"use client";
import { useMobileBackLayer } from "./useMobileBackLayer";
import { useEffect, useRef, type RefObject } from "react";

const stack: symbol[] = [];
let originalOverflow = "";
let mobileScrollers: Array<{ element: HTMLElement; overflow: string }> = [];

/** One focus/scroll boundary for shared editors, instructions and group dialogs. */
export function useModalFocus(
  ref: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  historyLayer = true,
) {
  useMobileBackLayer(historyLayer, onClose);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const token = Symbol();
    if (!stack.length) {
      originalOverflow = document.body.style.overflow;
      mobileScrollers = Array.from(
        document.querySelectorAll<HTMLElement>("[data-mobile-scroll]"),
      ).map((element) => ({ element, overflow: element.style.overflow }));
      mobileScrollers.forEach(({ element }) => {
        element.style.overflow = "hidden";
      });
    }
    stack.push(token);
    document.body.style.overflow = "hidden";
    const previous = document.activeElement as HTMLElement | null;
    const controls = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
        ) ?? [],
      ).filter((e) => e.getClientRects().length);
    // A dialog may nominate its primary input instead of its header Close button.
    const initial = controls();
    (initial.find((control) => control.hasAttribute("data-initial-focus")) ?? initial[0])?.focus();
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
      if (!stack.length) {
        document.body.style.overflow = originalOverflow;
        mobileScrollers.forEach(({ element, overflow }) => {
          element.style.overflow = overflow;
        });
        mobileScrollers = [];
      }
      if (wasTop && previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [ref]);
}
