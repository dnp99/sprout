"use client";

import type { CSSProperties, ReactNode } from "react";
import { useDesktop } from "@/hooks/useDesktop";
import { Modal } from "@/components/ui/overlays";

/** The picker stays inside its Popover boundary, so pointer-away handling also
 * recognizes sheet interactions. Modal supplies focus trapping, Back and Escape. */
export function ReportPickerSurface({
  mobileSheet = false,
  title,
  onClose,
  className,
  style,
  children,
}: {
  mobileSheet?: boolean;
  title: string;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const desktop = useDesktop();
  if (mobileSheet && !desktop) {
    return (
      <Modal title={title} onClose={onClose} className="report-selection-dialog">
        {children}
      </Modal>
    );
  }
  return (
    <div role="dialog" aria-label={title} className={className} style={style}>
      {children}
    </div>
  );
}
