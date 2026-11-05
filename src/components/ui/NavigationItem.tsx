"use client";

import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { sidebarItemClass } from "@/components/shared/sidebar-style";
import { mobileLedgerTabClass } from "@/components/shared/ledger-navigation";

/** Page navigation shares active/focus treatment, without borrowing content-tab
 * semantics, reserving page height, or changing route-owned scroll behavior. */
export function NavigationItem({
  active,
  label,
  icon: Icon,
  collapsed = false,
  variant = "rail",
  iconStrokeWidth = 2,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  active: boolean;
  label: string;
  icon: LucideIcon;
  collapsed?: boolean;
  variant?: "rail" | "mobile";
  iconStrokeWidth?: number;
}) {
  const mobile = variant === "mobile";
  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={!mobile && collapsed ? label : undefined}
      className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transition-none ${mobile ? `mobile-ledger-tab ${mobileLedgerTabClass} rounded-[10px] transition-colors ${active ? "bg-primary-soft" : "bg-transparent"}` : sidebarItemClass(active, collapsed)}`}
    >
      <Icon
        size={mobile ? 18 : 17}
        strokeWidth={iconStrokeWidth}
        className={mobile ? (active ? "text-primary" : "text-muted") : "flex-none"}
      />
      {(mobile || !collapsed) && (
        <span
          className={
            mobile
              ? `line-clamp-2 min-h-[26px] w-full max-w-full whitespace-normal text-[10px] leading-[13px] text-center ${active ? "font-semibold text-primary" : "font-medium text-muted"}`
              : "min-w-0 flex-1 truncate"
          }
        >
          {label}
        </span>
      )}
    </button>
  );
}
