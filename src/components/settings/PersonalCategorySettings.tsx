"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import type { Category } from "@/lib/types";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { PersonalCategoryOrganizer } from "@/components/shared/PersonalCategoryOrganizer";
import { CategorySettingsList } from "@/components/shared/CategorySettingsList";
import { Modal } from "@/components/ui/overlays";

/** Read only personal categories here: matching group defaults are independent records. */
export function PersonalCategorySettings() {
  const categories = useStore((s) => s.categories);
  const t = useTranslations("groups");
  const settings = useTranslations("settingsPage");
  const [organizing, setOrganizing] = useState(false);
  const [editing, setEditing] = useState<Category | null | undefined>();
  const buttonClass =
    "min-h-11 rounded-[10px] border border-edge bg-card px-3 text-sm font-semibold text-ink";
  return (
    <section className="surface-mint rounded-[14px] border border-edge p-4">
      <h2 className="font-bold text-ink">{settings("categoryManagement")}</h2>
      <p className="mt-2 text-sm text-muted">{settings("categoryScope")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={() => setOrganizing(true)}>
          {t("treeTitle")}
        </button>
        <button type="button" className={buttonClass} onClick={() => setEditing(null)}>
          {t("addCategory")}
        </button>
      </div>
      <CategorySettingsList
        categories={categories}
        onEdit={(id) => setEditing(categories.find((category) => category.id === id))}
      />
      {editing !== undefined && (
        <Modal
          title={t(editing ? "editCategory" : "addCategory")}
          onClose={() => setEditing(undefined)}
        >
          <AddCategoryForm
            key={editing?.id ?? "new"}
            category={editing ?? undefined}
            onDone={() => setEditing(undefined)}
          />
        </Modal>
      )}
      {organizing && <PersonalCategoryOrganizer onDone={() => setOrganizing(false)} />}
    </section>
  );
}
