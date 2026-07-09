"use client";

/** A centered, muted empty-state message for a dashboard section that has no
 *  data yet (zero-transaction "starter" state — see plans/007). Optional
 *  `children` render CTA buttons below the message; nav differs per surface, so
 *  callers pass their own. */
export function EmptyHint({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-3 py-6 text-center">
      <p className="max-w-[240px] text-[12.5px] font-medium leading-relaxed text-muted">{title}</p>
      {children}
    </div>
  );
}
