export type LedgerContext = "personal" | "group";

// Presentation-only handoff: the two route shells remount independently. A
// short-lived in-memory marker lets the destination animate from the old side
// without persisting preference/data or delaying navigation for an animation.
let pending: { from: LedgerContext; to: LedgerContext; path: string; at: number } | null = null;

/** Record only an approved same-tab context change, never a cancelled guard. */
export function recordContextSwitch(
  from: LedgerContext,
  to: LedgerContext,
  path: string,
  now = Date.now(),
) {
  if (from !== to) pending = { from, to, path: path.split("?")[0], at: now };
}

/** Expired markers must not animate a later visit or an unrelated route. */
export function contextSwitchMotionOrigin(
  to: LedgerContext,
  path: string,
  now = Date.now(),
): LedgerContext | undefined {
  return pending?.to === to && pending.path === path && now >= pending.at && now - pending.at < 1000
    ? pending.from
    : undefined;
}
