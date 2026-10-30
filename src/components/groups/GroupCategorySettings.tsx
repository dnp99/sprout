"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { DEFAULT_CATEGORIES } from "@/lib/auth/defaultCategories";
import type { GroupSnapshot, GroupCategory } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { orderGroupCategories, groupCategoryLabel } from "@/lib/groups/category-tree";
import { CategoryIdentityFields } from "@/components/shared/CategoryIdentityFields";
import { CategoryDeleteButton } from "@/components/shared/CategoryDeleteButton";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { GroupCategoryOrganizer } from "./GroupCategoryOrganizer";
import { GroupDialog, Panel, buttonClass, primaryClass } from "./ui";

/** Editing opens next to its context, rather than silently filling a form far below the list. */
export function GroupCategorySettings({
  data,
  run,
  busy,
}: {
  data: GroupSnapshot;
  run: (op: GroupOperation) => Promise<unknown>;
  busy: boolean;
}) {
  const t = useTranslations("groups");
  const [organizing, setOrganizing] = useState(false);
  const [editing, setEditing] = useState<GroupCategory | null | undefined>();
  const [error, setError] = useState("");
  const editable = data.group.role === "owner" && !data.group.archivedAt;
  return (
    <>
      <Panel tone="mint">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">{t("categories")}</h2>
          {editable && (
            <div className="flex gap-2">
              <button className={buttonClass} disabled={busy} onClick={() => setOrganizing(true)}>
                {t("treeTitle")}
              </button>
              <button
                className={buttonClass}
                disabled={busy}
                onClick={() => {
                  setError("");
                  setEditing(null);
                }}
              >
                {t("addCategory")}
              </button>
            </div>
          )}
        </div>
        <div className="mt-3 divide-y divide-edge">
          {orderGroupCategories(data.categories)
            .filter((c) => !c.archived)
            .map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2 text-sm">
                <EntitySymbol emoji={c.emoji} color={c.color} />
                <span className="flex-1">{groupCategoryLabel(data.categories, c.id)}</span>
                {editable && (
                  <button
                    className={buttonClass}
                    disabled={busy}
                    aria-label={t("editCategoryNamed", { name: c.name })}
                    onClick={() => {
                      setError("");
                      setEditing(c);
                    }}
                  >
                    <Pencil size={15} />
                    {t("edit")}
                  </button>
                )}
              </div>
            ))}
        </div>
      </Panel>
      {editing !== undefined && (
        <GroupDialog
          title={t(editing ? "editCategory" : "addCategory")}
          onClose={() => {
            if (!busy) setEditing(undefined);
          }}
        >
          <CategoryEditor
            key={editing?.id ?? "new"}
            category={editing}
            busy={busy}
            error={error}
            onSave={async (value) => {
              try {
                const result = await run({
                  type: "category",
                  id: editing?.id,
                  ...value,
                  archived: false,
                });
                if (result) setEditing(undefined);
              } catch (e) {
                setError(e instanceof Error ? e.message : t("failed"));
              }
            }}
            onDelete={
              editing
                ? async () => {
                    try {
                      const result = await run({ type: "categoryDelete", id: editing.id });
                      if (result) setEditing(undefined);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : t("failed"));
                    }
                  }
                : undefined
            }
          />
        </GroupDialog>
      )}
      {organizing && (
        <GroupCategoryOrganizer
          data={data}
          run={run}
          busy={busy}
          onDone={() => setOrganizing(false)}
        />
      )}
    </>
  );
}
function CategoryEditor({
  category,
  busy,
  error,
  onSave,
  onDelete,
}: {
  category: GroupCategory | null;
  busy: boolean;
  error: string;
  onSave: (value: { name: string; emoji: string; color: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const t = useTranslations("groups");
  const [name, setName] = useState(category?.name ?? "");
  const [emoji, setEmoji] = useState(category?.emoji ?? "🏷️");
  const [color, setColor] = useState(category?.color ?? DEFAULT_CATEGORIES[0].color);
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({ name, emoji, color });
      }}
    >
      <CategoryIdentityFields
        name={name}
        emoji={emoji}
        color={color}
        onName={setName}
        onEmoji={setEmoji}
        onColor={setColor}
        disabled={busy}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button className={primaryClass} disabled={busy || !name.trim()}>
        {t("save")}
      </button>
      {onDelete && <CategoryDeleteButton disabled={busy} onDelete={() => void onDelete()} />}
    </form>
  );
}
