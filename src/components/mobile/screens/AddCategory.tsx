"use client";

import { ChevronLeft } from "lucide-react";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { useStore } from "@/state/store";

export function AddCategory() {
  const goMobile = useStore((s) => s.goMobile);
  const back = () => goMobile("categories");

  return (
    <div className="flex flex-col px-4 pt-1 pb-6">
      <button
        type="button"
        onClick={back}
        aria-label="Back"
        className="flex items-center gap-2 text-ink"
      >
        <ChevronLeft size={18} strokeWidth={2} className="text-muted" />
        <span className="text-[20px] font-bold tracking-[-.02em]">New category</span>
      </button>

      <div className="mt-4">
        <AddCategoryForm onDone={back} />
      </div>
    </div>
  );
}
