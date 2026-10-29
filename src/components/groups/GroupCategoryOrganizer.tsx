"use client";
import { useGroupConfirmation } from "./useGroupConfirmation";
import { useState } from "react";
import { GripVertical, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { DEFAULT_CATEGORIES } from "@/lib/auth/defaultCategories";
import {
  categoryTreeDraft,
  mergeGroupCategory,
  moveGroupCategory,
  validateCategoryTree,
  type CategoryTreeDraft,
  type CategoryNode,
} from "@/lib/groups/category-tree";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { useCategoryDrag } from "./useCategoryDrag";
import { GroupDialog, buttonClass, inputClass, primaryClass } from "./ui";

/** Every move/merge stays local until a separate review and final confirmation succeeds. */
export function GroupCategoryOrganizer({
  data,
  run,
  busy,
  onDone,
}: {
  data: GroupSnapshot;
  run: (op: GroupOperation) => Promise<unknown>;
  busy: boolean;
  onDone: () => void;
}) {
  const { confirm, confirmation } = useGroupConfirmation();
  const t = useTranslations("groups");
  const [draft, setDraft] = useState(() => categoryTreeDraft(data.categories));
  const [baseline, setBaseline] = useState(() => categoryTreeDraft(data.categories));
  const [revision, setRevision] = useState(data.group.revision),
    [history, setHistory] = useState<CategoryTreeDraft[]>([]);
  const [selected, setSelected] = useState<string | null>(null),
    [name, setName] = useState("");
  const [review, setReview] = useState(false),
    [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline),
    conflict = revision !== data.group.revision;
  function stage(next: CategoryTreeDraft) {
    setHistory([...history, draft]);
    setDraft(next);
    setSelected(null);
    setError("");
  }
  function drop(source: string, target: string) {
    if (busy || review) return;
    try {
      const [action, id] = target.split(":");
      stage(
        action === "merge"
          ? mergeGroupCategory(
              draft,
              source,
              id,
              baseline.nodes.map((n) => n.id),
            )
          : moveGroupCategory(draft, source, id === "root" ? null : id),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : t("failed"));
    }
  }
  const { drag, hover, handle } = useCategoryDrag(drop, setSelected);
  const changes = [
    ...draft.nodes
      .filter((n) => !baseline.nodes.some((old) => old.id === n.id))
      .map((n) => t("treeAdded", { name: n.name })),
    ...draft.nodes
      .filter((n) => baseline.nodes.some((old) => old.id === n.id && old.parentId !== n.parentId))
      .map((n) =>
        t("treeMoved", {
          name: n.name,
          parent: draft.nodes.find((p) => p.id === n.parentId)?.name ?? t("treeRoots"),
        }),
      ),
    ...draft.merges.map((m) =>
      t("treeMerged", {
        name: baseline.nodes.find((n) => n.id === m.sourceId)?.name ?? "",
        target: draft.nodes.find((n) => n.id === m.targetId)?.name ?? "",
      }),
    ),
  ];
  async function close() {
    if (busy) return;
    if (review) setReview(false);
    else if (!dirty || (await confirm(t("treeDiscard")))) onDone();
  }
  function zone(target: string, label: string) {
    return (
      <button
        type="button"
        data-category-drop={target}
        disabled={busy || review}
        onClick={() => {
          if (selected) drop(selected, target);
        }}
        className={`min-h-11 w-full rounded-[10px] border border-dashed px-3 py-2 text-left text-xs font-medium transition ${hover === target ? "border-primary bg-primary-soft text-primary" : "border-edge text-muted"}`}
      >
        {label}
      </button>
    );
  }
  function node(item: CategoryNode) {
    return (
      <div key={item.id} className="space-y-2 rounded-[10px] border border-edge bg-card p-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            {...handle(item.id)}
            disabled={busy}
            aria-label={t("treeDrag", { name: item.name })}
            aria-pressed={selected === item.id}
            className={`flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-full ${selected === item.id ? "bg-primary-soft text-primary" : "text-muted"}`}
          >
            <GripVertical size={18} />
          </button>
          <EntitySymbol emoji={item.emoji} color={item.color} />
          <span className="min-w-0 break-words text-sm font-semibold">{item.name}</span>
        </div>
        {zone(`merge:${item.id}`, t("treeMergeHere", { name: item.name }))}
      </div>
    );
  }
  return (
    <GroupDialog title={t("treeTitle")} onClose={close}>
      {confirmation}
      <div className="mt-4 space-y-4">
        <p className="text-sm text-muted">{t(review ? "treeReviewHint" : "treeHint")}</p>
        {conflict && (
          <div role="alert" className="space-y-2 text-sm text-danger">
            <p>{t("treeConflict")}</p>
            <button
              disabled={busy}
              className={buttonClass}
              onClick={async () => {
                if (!dirty || (await confirm(t("treeDiscard")))) {
                  const next = categoryTreeDraft(data.categories);
                  setDraft(next);
                  setBaseline(next);
                  setRevision(data.group.revision);
                  setHistory([]);
                  setReview(false);
                  setSelected(null);
                  setError("");
                }
              }}
            >
              {t("treeReload")}
            </button>
          </div>
        )}
        {!review && (
          <>
            <div className="flex flex-wrap gap-2">
              <input
                aria-label={t("treeNewName")}
                placeholder={t("treeNewName")}
                className={`${inputClass} flex-1`}
                value={name}
                maxLength={40}
                disabled={busy}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || !name.trim() || draft.nodes.length >= 100}
                className={buttonClass}
                onClick={() => {
                  const node = {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    emoji: "🏷️",
                    color: data.categories[0]?.color ?? DEFAULT_CATEGORIES[0].color,
                    parentId: null,
                  };
                  stage({ ...draft, nodes: [...draft.nodes, node] });
                  setName("");
                }}
              >
                {t("treeNew")}
              </button>
            </div>
            <p role="status" className="text-xs text-muted">
              {selected
                ? t("treeSelected", {
                    name: draft.nodes.find((n) => n.id === selected)?.name ?? "",
                  })
                : t("treeTapHint")}
            </p>
            {zone("move:root", t("treeRoots"))}
            <div className="space-y-4">
              {draft.nodes
                .filter((n) => !n.parentId)
                .map((root) => (
                  <section
                    key={root.id}
                    className="space-y-2 rounded-[14px] border border-edge bg-track p-3"
                  >
                    {node(root)}
                    <div className="ml-3 space-y-2 border-l border-edge pl-3">
                      <p className="text-xs font-semibold text-muted">
                        {t("treeChildren", { name: root.name })}
                      </p>
                      {draft.nodes.filter((n) => n.parentId === root.id).map(node)}
                      {zone(`move:${root.id}`, t("treeDropChild", { name: root.name }))}
                    </div>
                  </section>
                ))}
            </div>
          </>
        )}
        {(changes.length > 0 || review) && (
          <div className="rounded-[10px] border border-edge bg-track p-3">
            <h3 className="text-sm font-semibold">{t("treeChanges")}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {changes.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>
        )}
        {review && <p className="text-sm text-muted">{t("treeMergeImpact")}</p>}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-edge bg-card py-3">
          {review ? (
            <button
              type="button"
              disabled={busy || conflict}
              className={primaryClass}
              onClick={async () => {
                try {
                  const result = await run({
                    type: "categoryTree",
                    draft,
                    expectedRevision: revision,
                  });
                  if (result) onDone();
                } catch (error) {
                  setError(error instanceof Error ? error.message : t("failed"));
                }
              }}
            >
              {t("treeConfirm")}
            </button>
          ) : (
            <button
              type="button"
              disabled={!dirty || busy || conflict}
              className={primaryClass}
              onClick={() => {
                try {
                  validateCategoryTree(data.categories, draft);
                  setError("");
                  setReview(true);
                } catch (error) {
                  setError(error instanceof Error ? error.message : t("failed"));
                }
              }}
            >
              {t("treeSave")}
            </button>
          )}
          {!review && (
            <button
              type="button"
              disabled={!history.length || busy}
              className={buttonClass}
              onClick={() => {
                setDraft(history[history.length - 1]);
                setHistory(history.slice(0, -1));
                setSelected(null);
              }}
            >
              <Undo2 size={15} />
              {t("treeUndo")}
            </button>
          )}
          <button type="button" disabled={busy} className={buttonClass} onClick={close}>
            {t(review ? "treeBack" : "cancel")}
          </button>
        </div>
      </div>
      {drag && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] max-w-56 -translate-x-1/2 rounded-[10px] border border-primary bg-card px-3 py-2 text-sm font-semibold text-ink shadow-lg"
          style={{ left: drag.x, top: drag.y - 40 }}
        >
          {draft.nodes.find((n) => n.id === drag.id)?.name}
        </div>
      )}
    </GroupDialog>
  );
}
