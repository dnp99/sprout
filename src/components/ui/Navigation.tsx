"use client";

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  Ref,
  MouseEventHandler,
} from "react";
import { selectionPresentation, type SelectionPresentation } from "./selection-presentation";

type NavigationLayout = "rail" | "mobile" | "context" | "segments";

/** Navigation owns presentation only. Routing, permission and discard guards
 * remain in domain wrappers; links retain native modified-click behavior. */
export function Navigation({
  children,
  layout = "rail",
  shape,
  size,
  appearance,
  className = "",
  indicatorIndex,
  motionFrom,
  ...props
}: HTMLAttributes<HTMLElement> &
  SelectionPresentation & {
    ref?: Ref<HTMLElement>;
    layout?: NavigationLayout;
    indicatorIndex?: 0 | 1;
    motionFrom?: 0 | 1;
  }) {
  return (
    <nav
      {...props}
      {...selectionPresentation({ shape, size, appearance })}
      data-layout={layout}
      className={`choice-track ${className}`}
    >
      <div
        className="choice-navigation-track"
        data-index={indicatorIndex}
        data-motion-from={motionFrom}
      >
        {indicatorIndex !== undefined && <span className="choice-indicator" aria-hidden="true" />}
        {children}
      </div>
    </nav>
  );
}

type Common = SelectionPresentation & {
  active: boolean;
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  collapsed?: boolean;
  variant?: NavigationLayout;
  children?: ReactNode;
};
type ButtonItem = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { href?: never };
type LinkItem = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & { href: string; prefetch?: boolean };

/** A real link or a button, never a tab. Focusing a route does not activate it. */
export function NavigationItem({
  active,
  label,
  icon,
  trailing,
  collapsed = false,
  variant = "rail",
  shape,
  size,
  appearance,
  children,
  ...props
}: ButtonItem | LinkItem) {
  const common = {
    ...selectionPresentation({ shape, size, appearance }),
    "data-layout": variant,
    "data-active": active,
    "data-collapsed": collapsed,
    "aria-current": active ? ("page" as const) : undefined,
    "aria-label": label,
    title: props.title ?? (collapsed ? label : undefined),
    className: `choice-item ${variant === "mobile" ? "mobile-ledger-tab" : ""} ${props.className ?? ""}`,
  };
  const content = (
    <>
      {icon && (
        <span className="choice-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {!collapsed && <span className="choice-label">{children ?? label}</span>}
      {trailing}
    </>
  );
  if (props.href !== undefined)
    return (
      <Link
        {...(props as Omit<LinkItem, keyof Common>)}
        {...common}
        onClick={(event) => {
          if (props["aria-disabled"] === true || props["aria-disabled"] === "true") {
            event.preventDefault();
            return;
          }
          (props.onClick as MouseEventHandler<HTMLAnchorElement> | undefined)?.(event);
        }}
      >
        {content}
      </Link>
    );
  return (
    <button {...(props as Omit<ButtonItem, keyof Common>)} {...common} type="button">
      {content}
    </button>
  );
}
