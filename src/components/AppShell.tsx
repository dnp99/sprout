"use client";

import { useState } from "react";
import { Placeholder } from "@/components/Placeholder";
import { TabBar } from "@/components/TabBar";
import { AddExpenseSheet } from "@/components/home/AddExpenseSheet";
import { HomeScreen } from "@/components/home/HomeScreen";
import { useStore } from "@/state/store";

/**
 * Mobile-first app frame: a centered 480px column with the active screen and a
 * sticky bottom tab bar. The center "+" opens the add-expense sheet.
 */
export function AppShell() {
  const { activeTab } = useStore();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex min-h-screen justify-center bg-bg">
      <div className="relative flex min-h-screen w-full max-w-app flex-col bg-bg">
        <main className="no-scrollbar flex-1 overflow-y-auto pb-4 pt-4">
          {activeTab === "home" ? <HomeScreen /> : <Placeholder tab={activeTab} />}
        </main>

        <TabBar onAdd={() => setAddOpen(true)} />
      </div>

      {addOpen && <AddExpenseSheet onClose={() => setAddOpen(false)} />}
    </div>
  );
}
