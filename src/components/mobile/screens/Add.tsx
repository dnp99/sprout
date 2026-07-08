"use client";

import { AddForm } from "@/components/shared/AddForm";
import { CancelSaveHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Add() {
  const { addMode, commitAdd, resetAdd, goMobile } = useStore(
    useShallow((s) => ({
      addMode: s.addMode,
      commitAdd: s.commitAdd,
      resetAdd: s.resetAdd,
      goMobile: s.goMobile,
    })),
  );
  const title = addMode === "income" ? "Add income 💰" : "Add expense ✍️";

  return (
    <div className="flex min-h-[560px] flex-col px-[22px] pt-3">
      <CancelSaveHeader
        title={title}
        onCancel={() => {
          resetAdd();
          goMobile("home");
        }}
        onSave={commitAdd}
      />
      <div className="mt-4 flex flex-1 flex-col">
        <AddForm showKeypad />
      </div>
    </div>
  );
}
