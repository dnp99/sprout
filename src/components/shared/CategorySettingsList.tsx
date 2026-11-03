"use client";

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
  return (
    <div className="mt-3 divide-y divide-edge">
      {roots.map((parent) => {
        const children = categories.filter((node) => node.parentId === parent.id);
        return (
          <div key={parent.id} role="group" aria-label={parent.name} className="py-2">
            {row(parent)}
            {children.length > 0 && (
              <div className="ml-2 border-l border-edge pl-5">
                {children.map((child) => row(child, true))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
