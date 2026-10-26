"use client";

// Keep component imports stable while store creation, effects, and household
// actions remain small independently maintained modules.
export { StoreProvider, useStore } from "./provider";
export type { AppState, AppStore } from "./types";
