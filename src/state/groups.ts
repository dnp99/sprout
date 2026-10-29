import type { GroupLedgerFilters } from "@/lib/groups/search";
import type { GroupListItem, GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import type { AppStore } from "./types";

export interface GroupState {
  groupMonths: Record<string, string>;
  groupList: GroupListItem[];
  groupData: GroupSnapshot | null;
  groupLoading: boolean;
  groupError: string | null;
  loadGroupList: () => Promise<void>;
  loadGroup: (
    id: string,
    month: string,
    page?: number,
    filters?: GroupLedgerFilters,
  ) => Promise<void>;
  clearGroup: () => void;
  saveGroup: (operation: GroupOperation) => Promise<{ id?: string; token?: string }>;
}
export class GroupApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: { duplicateIds?: string[] },
  ) {
    super(message);
  }
}
export async function groupFetch<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal,
  });
  const data = await res.json();
  if (!res.ok)
    throw new GroupApiError(data.error ?? "Unable to reach group.", res.status, data.details);
  return data as T;
}
/** Request generations prevent a late group/account response repainting another
 * context. Failed network writes retain their mutation identity for safe retry. */
export function groupSlice(
  set: (patch: Partial<AppStore>) => void,
  get: () => AppStore,
): GroupState {
  let generation = 0,
    controller: AbortController | undefined;
  const pending = new Map<string, { mutationId: string; revision: number }>();
  return {
    groupMonths: {},
    groupList: [],
    groupData: null,
    groupLoading: false,
    groupError: null,
    clearGroup: () => {
      generation++;
      controller?.abort();
      pending.clear();
      set({
        groupData: null,
        groupError: null,
        groupLoading: false,
        groupList: [],
        groupMonths: {},
      });
    },
    loadGroupList: async () => {
      const user = get().user.id;
      try {
        const data = await groupFetch<{ groups: GroupListItem[] }>("/api/groups");
        if (get().user.id === user && get().flowStep === "done") set({ groupList: data.groups });
      } catch (error) {
        if (error instanceof GroupApiError && error.status === 401 && get().user.id === user) {
          get().clearGroup();
          set({ flowStep: "login" });
        }
        throw error;
      }
    },
    loadGroup: async (id, month, page = 0, filters = {}) => {
      controller?.abort();
      controller = new AbortController();
      const seq = ++generation,
        user = get().user.id;
      set({
        groupMonths: { ...get().groupMonths, [id]: month },
        groupLoading: true,
        groupError: null,
        ...(get().groupData?.group.id !== id ? { groupData: null } : {}),
      });
      try {
        const query = new URLSearchParams({
          month,
          page: String(page),
          q: filters.query ?? "",
          payer: filters.payer ?? "",
          scope: filters.scope ?? "month",
        });
        const data = await groupFetch<GroupSnapshot>(
          `/api/groups/${id}?${query}`,
          undefined,
          controller.signal,
        );
        if (seq === generation && get().user.id === user && get().flowStep === "done")
          set({ groupData: data, groupLoading: false });
      } catch (e) {
        if (seq !== generation) return;
        if (e instanceof Error && e.name === "AbortError") return;
        if (e instanceof GroupApiError && e.status === 401 && get().user.id === user) {
          get().clearGroup();
          set({ flowStep: "login" });
          return;
        }
        set({
          groupLoading: false,
          groupError: e instanceof Error ? e.message : "Unable to load group.",
          ...(e instanceof GroupApiError && [401, 403, 404].includes(e.status)
            ? { groupData: null }
            : {}),
        });
      }
    },
    saveGroup: async (operation) => {
      const data = get().groupData;
      if (!data || get().flowStep !== "done") throw new Error("Reload the selected group.");
      const user = get().user.id,
        signature = JSON.stringify({ id: data.group.id, operation });
      if (!pending.has(signature))
        pending.set(signature, { mutationId: crypto.randomUUID(), revision: data.group.revision });
      const receipt = pending.get(signature)!;
      try {
        const result = await groupFetch<{ id?: string; token?: string }>(
          `/api/groups/${data.group.id}`,
          { ...operation, mutationId: receipt.mutationId, revision: receipt.revision },
        );
        pending.delete(signature);
        if (get().user.id !== user) throw new Error("Account changed. Reload before continuing.");
        return result;
      } catch (e) {
        if (e instanceof GroupApiError) pending.delete(signature);
        if (e instanceof GroupApiError && e.status === 401 && get().user.id === user) {
          get().clearGroup();
          set({ flowStep: "login" });
        }
        throw e;
      }
    },
  };
}
