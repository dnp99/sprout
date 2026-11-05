"use client";

import type { ComponentProps } from "react";
import { SelectionControl } from "./SelectionControl";

export type { SelectionOption } from "./SelectionControl";

/** Pressed-button filters deliberately keep same-choice callbacks (for example,
 * reopening the current report period). They never imply linked tab panels. */
export function SegmentedControl<T extends string>(
  props: Omit<ComponentProps<typeof SelectionControl<T>>, "tabsId">,
) {
  return <SelectionControl {...props} />;
}
