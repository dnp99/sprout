import type { GroupOperation } from "@/lib/groups/validation";
export type { GroupSnapshot } from "@/lib/groups/dto";
export type GroupOperationRunner = (operation: GroupOperation) => Promise<unknown>;
export type SuggestedRepayment = { from: string; to: string; amountCents: number };
