/** App-facing group records keep dates as strings and money as integer cents. */
export interface GroupMember {
  id: string;
  name: string;
  role: string;
  status: string;
  userId: string | null;
}
export interface GroupCategory {
  parentId?: string | null;
  id: string;
  name: string;
  emoji: string;
  color: string;
  archived: boolean;
}
export interface GroupShare {
  memberId: string;
  amountCents: number;
  weight: number;
}
export interface SplitSnapshot {
  amountCents: number;
  categoryId: string | null;
  payerId: string | null;
  occurredOn: string;
  kind: string;
  settlement: boolean;
  shares: GroupShare[];
}
export interface GroupSplitResult {
  snapshot: SplitSnapshot;
  review: "current" | "pending" | "excluded";
  reviewedVersion: number;
  calculatedAt: string;
}
export interface GroupEntry {
  splitResult?: GroupSplitResult | null;
  id: string;
  authorId: string;
  payerId: string | null;
  categoryId: string | null;
  kind: string;
  amountCents: number;
  merchant: string;
  note: string;
  occurredOn: string;
  refundOf: string | null;
  settlement: boolean;
  splitMethod: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
  voidedAt: string | null;
  shares: GroupShare[];
}
export interface GroupRepayment {
  id: string;
  senderId: string;
  recipientId: string;
  recordedBy: string;
  amountCents: number;
  occurredOn: string;
  note: string;
  reversedAt: string | null;
  reversalReason: string | null;
}
export interface GroupListItem {
  id: string;
  name: string;
  revision: number;
  archivedAt: string | null;
  memberId: string;
  role: string;
}
export interface GroupSnapshot {
  group: GroupListItem;
  members: GroupMember[];
  categories: GroupCategory[];
  categorySplitRules?: {
    categoryId: string;
    participants: { memberId: string; weight: number }[];
  }[];
  splitDefaults: {
    method: string;
    valid: boolean;
    participants: { memberId: string; weight: number }[];
  };
  entries: GroupEntry[];
  /** Complete visible calendar range, independent of ledger pagination. */
  calendarEntries?: GroupEntry[];
  /** Complete non-voided ledger for payer/category reporting, never a paged slice. */
  reportEntries?: GroupEntry[];
  totalEntries: number;
  page: number;
  repayments: GroupRepayment[];
  balances: Record<string, number>;
  transfers: { from: string; to: string; amountCents: number }[];
  budget: { poolCents: number; allocations: Record<string, number>; exists: boolean };
  summary: {
    spendingCents: number;
    incomeCents: number;
    yourShareCents: number;
    categorySpending: Record<string, number>;
  };
  activity: {
    id: string;
    actorId: string | null;
    action: string;
    reason: string;
    createdAt: string;
  }[];
  invites: { id: string; expiresAt: string; used: boolean; revoked: boolean }[];
}
