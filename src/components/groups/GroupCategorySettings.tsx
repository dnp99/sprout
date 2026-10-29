"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_CATEGORIES } from "@/lib/auth/defaultCategories";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { orderGroupCategories, groupCategoryLabel } from "@/lib/groups/category-tree";
import { EmojiIconPickerButton } from "@/components/shared/EmojiIconPicker";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { GroupCategoryOrganizer } from "./GroupCategoryOrganizer";
import { Field, Panel, inputClass, buttonClass, primaryClass } from "./ui";

/** Single edits and reviewed tree drafts share the same stored category identities. */
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
  const [organizing, setOrganizing] = useState(false),
    [category, setCategory] = useState(""),
    [emoji, setEmoji] = useState("🏷️"),
    [color, setColor] = useState(data.categories[0]?.color ?? DEFAULT_CATEGORIES[0].color),
    [categoryId, setCategoryId] = useState<string | undefined>(),
    [error, setError] = useState("");
  const owner = data.group.role === "owner",
    archived = !!data.group.archivedAt;
  async function act(op: GroupOperation) {
    try {
      const result = await run(op);
      setError("");
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : t("failed"));
      return null;
    }
  }
  return (
    <>
      <Panel tone="mint">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">{t("categories")}</h2>
          {owner && !archived && (
            <button
              type="button"
              disabled={busy}
              className={buttonClass}
              onClick={() => setOrganizing(true)}
            >
              {t("treeTitle")}
            </button>
          )}
        </div>
        <div className="mt-3 space-y-2">
          {orderGroupCategories(data.categories).map((c) => (
            <div key={c.id} className="flex items-center gap-3 text-sm">
              <EntitySymbol emoji={c.emoji} color={c.color} />
              <span className="flex-1">
                {groupCategoryLabel(data.categories, c.id)}
                {c.archived ? ` (${t("archived")})` : ""}
              </span>
              {owner && !archived && (
                <>
                  <button
                    className={buttonClass}
                    onClick={() => {
                      setCategoryId(c.id);
                      setCategory(c.name);
                      setEmoji(c.emoji);
                      setColor(c.color);
                    }}
                  >
                    {t("edit")}
                  </button>
                  <button
                    disabled={busy}
                    className={buttonClass}
                    onClick={() =>
                      void act({
                        type: "category",
                        id: c.id,
                        name: c.name,
                        emoji: c.emoji,
                        color: c.color,
                        archived: !c.archived,
                      })
                    }
                  >
                    {t(c.archived ? "restore" : "archive")}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        {owner && !archived && (
          <form
            className="mt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await act({
                  type: "category",
                  id: categoryId,
                  name: category,
                  emoji,
                  color,
                  archived: false,
                })
              ) {
                setCategory("");
                setCategoryId(undefined);
              }
            }}
          >
            <h3 className="text-sm font-semibold">
              {t(categoryId ? "editCategory" : "addCategory")}
            </h3>
            <Field label={t("name")}>
              <input
                className={inputClass}
                required
                maxLength={40}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Field>
            <div className="flex items-center gap-3">
              <EmojiIconPickerButton
                value={emoji}
                onChange={setEmoji}
                title={t("icon")}
                ariaLabel={t("icon")}
                color={color}
                round
              />
              <label
                title={t("color")}
                className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-primary"
              >
                <span
                  aria-hidden="true"
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <input
                  aria-label={t("color")}
                  type="color"
                  value={color}
                  disabled={busy}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
                />
              </label>
              <button className={primaryClass} disabled={busy}>
                {t("save")}
              </button>
              {categoryId && (
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    setCategoryId(undefined);
                    setCategory("");
                  }}
                >
                  {t("cancel")}
                </button>
              )}
            </div>
          </form>
        )}
      </Panel>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
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
