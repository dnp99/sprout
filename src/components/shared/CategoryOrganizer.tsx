"use client";
import { CATEGORY_NAME_MAX_LENGTH } from "@/lib/categories/validation";
import { useState } from "react";
import { ArrowUp, ArrowDown, GripVertical, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { DEFAULT_CATEGORIES } from "@/lib/auth/defaultCategories";
import {
  categoryTreeDraft,
  mergeGroupCategory,
  moveGroupCategory,
  reorderCategory,
  validateCategoryTree,
  type CategoryTreeDraft,
  type CategoryNode,
} from "@/lib/groups/category-tree";
import type { GroupCategory } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { useCategoryDrag } from "@/components/groups/useCategoryDrag";
import { GroupDialog, buttonClass, inputClass, primaryClass } from "@/components/groups/ui";

/** One editor for independent personal/group trees. Record handling is an inline
 * choice; Save performs the write directly, without another confirmation layer. */
export function CategoryOrganizer({
  data,
  run,
  busy,
  onDone,
}: {
  data: {
    categories: GroupCategory[];
    group: { revision: number };
    recordCounts?: Record<string, number>;
  };
  run: (op: Extract<GroupOperation, { type: "categoryTree" }>) => Promise<unknown>;
  busy: boolean;
  onDone: () => void;
}) {
  const t = useTranslations("groups");
  const [draft, setDraft] = useState(() => categoryTreeDraft(data.categories));
  const [baseline, setBaseline] = useState(() => categoryTreeDraft(data.categories));
  const [revision, setRevision] = useState(data.group.revision);
  const [history, setHistory] = useState<CategoryTreeDraft[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [choices, setChoices] = useState<Record<string, "keep" | "uncategorize">>({});
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline),
    conflict = revision !== data.group.revision;
  const moved = draft.nodes.filter(
    (n) =>
      baseline.nodes.some((b) => b.id === n.id && b.parentId !== n.parentId) &&
      (data.recordCounts?.[n.id] ?? 0) > 0,
  );
  function stage(next: CategoryTreeDraft) {
    setHistory([...history, draft]);
    setDraft(next);
    setSelected(null);
    setError("");
  }
  function drop(source: string, target: string) {
    if (busy) return;
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
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    }
  }
  const { drag, hover, handle } = useCategoryDrag(drop, setSelected);
  function zone(target: string, label: string) {
    return (
      <button
        type="button"
        data-category-drop={target}
        disabled={busy}
        onClick={() => {
          if (selected) drop(selected, target);
        }}
        className={`min-h-11 w-full rounded-[10px] border border-dashed px-3 py-2 text-left text-xs ${hover === target ? "border-primary bg-primary-soft text-primary" : "border-edge text-muted"}`}
      >
        {label}
      </button>
    );
  }
  function node(item: CategoryNode) {
    const siblings = draft.nodes.filter((n) => n.parentId === item.parentId),
      index = siblings.findIndex((n) => n.id === item.id);
    return (
      <div key={item.id} className="space-y-2 rounded-[10px] border border-edge bg-card p-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...handle(item.id)}
            disabled={busy}
            aria-label={t("treeDrag", { name: item.name })}
            aria-pressed={selected === item.id}
            className="flex h-11 w-11 shrink-0 touch-none items-center justify-center text-muted"
          >
            <GripVertical size={17} />
          </button>
          <EntitySymbol emoji={item.emoji} color={item.color} />
          <span className="min-w-0 flex-1 break-words text-sm font-semibold">{item.name}</span>
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center text-muted disabled:opacity-25"
              disabled={busy || (direction < 0 ? index === 0 : index === siblings.length - 1)}
              aria-label={t(direction < 0 ? "categoryMoveUp" : "categoryMoveDown", {
                name: item.name,
              })}
              onClick={() => stage(reorderCategory(draft, item.id, direction))}
            >
              {direction < 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          ))}
        </div>
        {zone(`merge:${item.id}`, t("treeMergeHere", { name: item.name }))}
      </div>
    );
  }
  return (
    <GroupDialog
      title={t("treeTitle")}
      onClose={() => {
        if (!busy) onDone();
      }}
    >
      <div className="mt-4 space-y-4">
        <p className="text-sm text-muted">{t("categoryOrganizeHint")}</p>
        {conflict && (
          <div role="alert" className="space-y-2 text-sm text-danger">
            <p>{t("treeConflict")}</p>
            <button
              className={buttonClass}
              disabled={busy}
              onClick={() => {
                const next = categoryTreeDraft(data.categories);
                setDraft(next);
                setBaseline(next);
                setRevision(data.group.revision);
                setHistory([]);
                setChoices({});
              }}
            >
              {t("treeReload")}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            aria-label={t("treeNewName")}
            placeholder={t("treeNewName")}
            value={name}
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            disabled={busy}
            className={`${inputClass} flex-1`}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            className={buttonClass}
            disabled={busy || !name.trim() || draft.nodes.length >= 100}
            onClick={() => {
              stage({
                ...draft,
                nodes: [
                  ...draft.nodes,
                  {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    emoji: "🏷️",
                    color: data.categories[0]?.color ?? DEFAULT_CATEGORIES[0].color,
                    parentId: null,
                  },
                ],
              });
              setName("");
            }}
          >
            {t("treeNew")}
          </button>
        </div>
        <p role="status" className="text-xs text-muted">
          {selected
            ? t("treeSelected", { name: draft.nodes.find((n) => n.id === selected)?.name ?? "" })
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
                  {draft.nodes.filter((n) => n.parentId === root.id).map(node)}
                  {zone(`move:${root.id}`, t("treeDropChild", { name: root.name }))}
                </div>
              </section>
            ))}
        </div>
        {moved.map((n) => (
          <fieldset
            key={n.id}
            className="space-y-2 rounded-[10px] border border-edge bg-track p-3"
            disabled={busy}
          >
            <legend className="px-1 text-sm font-semibold">
              {t("categoryRecordsQuestion", {
                name: n.name,
                count: data.recordCounts?.[n.id] ?? 0,
              })}
            </legend>
            {(["keep", "uncategorize"] as const).map((action) => (
              <label key={action} className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="radio"
                  name={`records-${n.id}`}
                  value={action}
                  checked={choices[n.id] === action}
                  onChange={() => setChoices({ ...choices, [n.id]: action })}
                />
                {t(action === "keep" ? "categoryRecordsMove" : "categoryRecordsUncategorize")}
              </label>
            ))}
          </fieldset>
        ))}
        {draft.merges.length > 0 && <p className="text-xs text-muted">{t("categoryMergeHint")}</p>}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-edge bg-card py-3">
          <button
            type="button"
            className={primaryClass}
            disabled={!dirty || busy || conflict || moved.some((n) => !choices[n.id])}
            onClick={async () => {
              try {
                validateCategoryTree(data.categories, draft);
                const result = await run({
                  type: "categoryTree",
                  draft: {
                    ...draft,
                    recordChoices: moved.map((n) => ({ categoryId: n.id, action: choices[n.id] })),
                  },
                  expectedRevision: revision,
                });
                if (result) onDone();
              } catch (e) {
                setError(e instanceof Error ? e.message : t("failed"));
              }
            }}
          >
            {t("treeSave")}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={!history.length || busy}
            onClick={() => {
              setDraft(history[history.length - 1]);
              setHistory(history.slice(0, -1));
            }}
          >
            <Undo2 size={15} />
            {t("treeUndo")}
          </button>
          <button type="button" className={buttonClass} disabled={busy} onClick={onDone}>
            {t("cancel")}
          </button>
        </div>
      </div>
      {drag && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] rounded-[10px] border border-primary bg-card px-3 py-2 text-sm text-ink shadow-lg"
          style={{ left: drag.x, top: drag.y - 40 }}
        >
          {draft.nodes.find((n) => n.id === drag.id)?.name}
        </div>
      )}
    </GroupDialog>
  );
}
