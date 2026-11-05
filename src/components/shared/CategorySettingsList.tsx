"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { categoryLabel, type CategoryLabelNode } from "@/lib/categories/labels";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { IconAction } from "@/components/ui/IconAction";

type CategoryIdentity = CategoryLabelNode & { emoji: string; color: string };

/** Both ledgers show the actual tree: strong parent rows and indented children.
 * Edit labels retain full paths so repeated child names remain accessible. */
export function CategorySettingsList({
  categories,
  onEdit,
  disabled = false,
}: {
  categories: readonly CategoryIdentity[];
  onEdit?: (id: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("groups");
  const navigation = useTranslations("settingsNavigation");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase();
  const matches = (node: CategoryIdentity) =>
    categoryLabel(categories, node).toLocaleLowerCase().includes(normalized);
  const roots = categories.filter(
    (node) => !node.parentId || !categories.some((parent) => parent.id === node.parentId),
  );
  function row(category: CategoryIdentity, child = false) {
    return (
      <div
        key={category.id}
        className={`flex min-h-11 items-center gap-3 py-1 ${child ? "text-[13px] text-muted" : "text-sm font-semibold text-ink"}`}
      >
        <EntitySymbol emoji={category.emoji} color={category.color} size={child ? 16 : 18} />
        <span className="min-w-0 flex-1 break-words">{category.name}</span>
        {onEdit && (
          <IconAction
            action="edit"
            className="rounded-[10px] border border-edge bg-card text-ink hover:bg-track"
            label={t("editCategoryNamed", { name: categoryLabel(categories, category) })}
            disabled={disabled}
            onClick={() => onEdit(category.id)}
          />
        )}
      </div>
    );
  }
  const visibleRoots = roots.filter(
    (parent) =>
      !normalized ||
      matches(parent) ||
      categories.some((child) => child.parentId === parent.id && matches(child)),
  );
  return (
    <div className="mt-3">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={navigation("searchCategories")}
        placeholder={navigation("searchCategories")}
        className="mb-3 min-h-11 w-full rounded-[10px] border border-edge bg-card px-3 text-control text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      />
      {!visibleRoots.length && (
        <p className="py-3 text-body text-muted">{navigation("noCategories")}</p>
      )}
      <div className="divide-y divide-edge">
        {visibleRoots.map((parent) => {
          const children = categories.filter(
            (node) =>
              node.parentId === parent.id && (!normalized || matches(parent) || matches(node)),
          );
          return (
            <div key={parent.id} role="group" aria-label={parent.name} className="py-2">
              {row(parent)}
              {children.length > 0 && (
                <details
                  className="group"
                  key={normalized || "browse"}
                  open={normalized ? true : undefined}
                >
                  <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-2 text-label font-medium text-muted">
                    <ChevronRight
                      size={14}
                      className="transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    />
                    {navigation("subcategories")} · {children.length}
                  </summary>
                  <div className="ml-2 border-l border-edge pl-5">
                    {children.map((child) => row(child, true))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
