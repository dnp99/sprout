"use client";

import { Activity } from "./Activity";

/** Legacy internal search destinations reuse the transaction workspace; search
 * now opens in place so results never require a separate full-screen flow. */
export function Search() {
  return <Activity />;
}
