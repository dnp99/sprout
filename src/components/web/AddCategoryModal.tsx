"use client";

import { useTranslations } from "next-intl";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";

/** App-level category creator opened directly from the desktop Budget header. */
export function AddCategoryModal() {
  const set = useStore((state) => state.set);
  const t = useTranslations("budget");
  const close = () => set({ webAddCategoryOpen: false });

  return (
    <Modal title={t("addCategory")} onClose={close} width={440}>
      <div className="mt-4">
        <AddCategoryForm onDone={close} />
      </div>
    </Modal>
  );
}
