"use client";
import { useEffect } from "react";

/** Draft ownership stays with the screen; the group shell guards navigation. */
export function useSettlementDirty(dirty: boolean, onChange?: (dirty: boolean) => void) {
  useEffect(() => {
    onChange?.(dirty);
  }, [dirty, onChange]);
  useEffect(() => () => onChange?.(false), [onChange]);
}
