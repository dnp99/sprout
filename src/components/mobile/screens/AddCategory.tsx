"use client";

import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";

export function AddCategory() {
  const goMobile = useStore((s) => s.goMobile);
  const back = () => goMobile("categories");

  return (
    <div className="px-[22px] pt-3">
      <ScreenHeader title="New category ✨" onBack={back} />
      <div className="mt-5">
        <AddCategoryForm onDone={back} />
      </div>
    </div>
  );
}
