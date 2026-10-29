"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/** Pointer capture works on touch and mouse; tap/keyboard selection offers the same drop actions. */
export function useCategoryDrag(
  onDrop: (source: string, target: string) => void,
  onSelect: (id: string) => void,
) {
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const active = useRef<{
    id: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    moved: boolean;
    host: HTMLElement;
  } | null>(null);
  const frame = useRef(0),
    suppressClick = useRef(false);
  const latest = useRef(onDrop);
  latest.current = onDrop;
  function stop() {
    cancelAnimationFrame(frame.current);
    active.current = null;
    setDrag(null);
    setHover(null);
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function targetAt(x: number, y: number) {
    return (
      document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-category-drop]")?.dataset
        .categoryDrop ?? null
    );
  }
  function scroll() {
    const state = active.current;
    if (!state?.moved) return;
    const rect = state.host.getBoundingClientRect(),
      top = Math.max(0, rect.top),
      bottom = Math.min(innerHeight, rect.bottom);
    const amount = state.y < top + 50 ? -12 : state.y > bottom - 50 ? 12 : 0;
    if (amount) state.host.scrollTop += amount;
    setHover(targetAt(state.x, state.y));
    frame.current = requestAnimationFrame(scroll);
  }
  return {
    drag,
    hover,
    handle: (id: string) => ({
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;
        let host: HTMLElement = event.currentTarget;
        while (
          host.parentElement &&
          !(
            /auto|scroll/.test(getComputedStyle(host).overflowY) &&
            host.scrollHeight > host.clientHeight
          )
        )
          host = host.parentElement;
        event.currentTarget.setPointerCapture(event.pointerId);
        active.current = {
          id,
          startX: event.clientX,
          startY: event.clientY,
          x: event.clientX,
          y: event.clientY,
          moved: false,
          host,
        };
        suppressClick.current = false;
      },
      onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
        const state = active.current;
        if (!state) return;
        state.x = event.clientX;
        state.y = event.clientY;
        if (!state.moved && Math.hypot(state.x - state.startX, state.y - state.startY) < 6) return;
        if (!state.moved) {
          state.moved = true;
          onSelect(id);
          frame.current = requestAnimationFrame(scroll);
        }
        event.preventDefault();
        setDrag({ id, x: state.x, y: state.y });
        setHover(targetAt(state.x, state.y));
      },
      onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
        const state = active.current,
          target = targetAt(event.clientX, event.clientY);
        if (state?.moved) {
          suppressClick.current = true;
          if (target) latest.current(state.id, target);
        }
        stop();
      },
      onPointerCancel: stop,
      onClick: () => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onSelect(id);
      },
    }),
  };
}
