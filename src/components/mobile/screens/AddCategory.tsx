"use client";

import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";

export function AddCategory() {
  const goMobile = useStore((s) => s.goMobile);
  const back = () => goMobile("categories");

  return (
    <div className="flex flex-col px-4 pt-1 pb-6">
      <ScreenHeader title="New category" onBack={back} />

      <div className="mt-4">
        <AddCategoryForm onDone={back} />
      </div>
    </div>
  );
}
