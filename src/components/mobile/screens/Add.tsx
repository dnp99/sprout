"use client";

import { PersonalTransactionDialog } from "@/components/shared/PersonalTransactionDialog";

/** Mobile uses the same dialog, fields and numbered keypad as desktop/Groups. */
export function Add() {
  return <PersonalTransactionDialog mobile />;
}
