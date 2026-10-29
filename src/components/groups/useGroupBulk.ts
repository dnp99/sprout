"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";
import { downloadTextFile } from "@/lib/download";
import { groupFetch, GroupApiError } from "@/state/groups";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { BulkAction, GroupSelection } from "@/lib/groups/bulk-validation";
import type { GroupBulkResult } from "@/lib/groups/bulk";

/** Preserve a failed network request's exact identity/revision to make copy retries safe. */
export function useGroupBulk(
  data: GroupSnapshot,
  refresh: () => Promise<void>,
  onBusyChange: (busy: boolean) => void,
) {
  const t = useTranslations("groups"),
    { showToast } = useToast();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef<{ signature: string; body: unknown } | null>(null);
  const lock = useRef(false),
    active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function run(action: BulkAction, entries: GroupSelection) {
    if (lock.current) return false;
    const signature = JSON.stringify({ groupId: data.group.id, action, entries });
    if (pending.current?.signature !== signature)
      pending.current = {
        signature,
        body: {
          ...action,
          entries,
          revision: data.group.revision,
          mutationId: crypto.randomUUID(),
        },
      };
    lock.current = true;
    setBusy(true);
    setError("");
    onBusyChange(true);
    try {
      const result = await groupFetch<GroupBulkResult>(
        `/api/groups/${data.group.id}/bulk`,
        pending.current.body,
      );
      pending.current = null;
      if (!active.current) return true;
      if (result.csv !== undefined) downloadTextFile("sprout-group-selected.csv", result.csv);
      else await refresh().catch(() => {});
      showToast(t("bulkDone", { count: result.count }));
      return true;
    } catch (error) {
      if (error instanceof GroupApiError) pending.current = null;
      if (active.current) {
        const message = error instanceof Error ? error.message : t("failed");
        setError(message);
        showToast(message, "error");
        if (error instanceof GroupApiError && error.status === 409) await refresh().catch(() => {});
      }
      return false;
    } finally {
      lock.current = false;
      if (active.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }
  return { run, busy, error };
}
