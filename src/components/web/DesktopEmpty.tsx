import type { LucideIcon } from "lucide-react";

/** Centered desktop empty-state panel — a muted icon tile, a title, a short
 *  description, and optional action buttons. Shared by the Transactions and
 *  Trends views to match the design's empty screens. */
export function DesktopEmpty({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-track">
        <Icon size={30} strokeWidth={1.7} className="text-muted" />
      </span>
      <div className="mt-[18px] text-[18px] font-bold">{title}</div>
      <p className="mt-[7px] max-w-[380px] text-[13.5px] font-medium leading-[1.55] text-muted">
        {description}
      </p>
      {children && <div className="mt-5 flex gap-3">{children}</div>}
    </div>
  );
}
