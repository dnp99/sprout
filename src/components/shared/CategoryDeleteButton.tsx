"use client";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function CategoryDeleteButton({
  disabled,
  onDelete,
}: {
  disabled: boolean;
  onDelete: () => void;
}) {
  const t = useTranslations("groups");
  return (
    <div className="mt-8 border-t border-edge pt-5">
      <p className="mb-3 text-xs text-muted">{t("categoryDeleteHint")}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-danger px-4 py-2 text-sm font-semibold text-danger hover:bg-track disabled:opacity-50"
      >
        <Trash2 size={15} />
        {t("deleteCategory")}
      </button>
    </div>
  );
}
