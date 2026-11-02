"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

/** Compact actions keep full touch targets and translated accessible labels;
 * confirmation dialogs and single-record editors retain their explicit text. */
export function IconAction({
  action,
  label,
  className = "",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  action: "edit" | "delete";
  label: string;
}) {
  const Icon = action === "edit" ? Pencil : Trash2;
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center disabled:opacity-50 ${className || `rounded-[10px] hover:bg-primary-soft ${action === "delete" ? "text-danger" : "text-primary"}`}`}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
