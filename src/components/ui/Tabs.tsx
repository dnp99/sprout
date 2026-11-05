"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { useStableTabPanel } from "@/hooks/useStableTabPanel";
import { SelectionControl, type SelectionOption } from "./SelectionControl";

type TabsContextValue = ReturnType<typeof useStableTabPanel> & {
  id: string;
  value: string;
  select: (value: string) => void;
  stabilize: boolean;
};
const TabsContext = createContext<TabsContextValue | null>(null);
function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabList and TabPanel require Tabs.");
  return context;
}

/** Controlled content tabs leave drafts and routing with their owning screen.
 * Reserve visible height only when the caller opts into scroll stabilization. */
export function Tabs<T extends string>({
  value,
  onChange,
  stabilize = false,
  children,
}: {
  value: T;
  onChange: (value: T) => void;
  stabilize?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const panel = useStableTabPanel();
  return (
    <TabsContext.Provider
      value={{
        ...panel,
        id,
        value,
        stabilize,
        select: (next) => {
          if (next === value) return;
          if (stabilize) panel.prepareSwitch();
          onChange(next as T);
        },
      }}
    >
      {children}
    </TabsContext.Provider>
  );
}

export function TabList<T extends string>({
  options,
  label,
  className = "",
  buttonClassName,
  disabled,
}: {
  options: readonly SelectionOption<T>[];
  label: string;
  className?: string;
  buttonClassName?: (active: boolean) => string;
  disabled?: boolean;
}) {
  const context = useTabs();
  return (
    <SelectionControl
      options={options}
      value={context.value}
      onChange={context.select}
      tabsId={context.id}
      label={label}
      disabled={disabled}
      className={className}
      buttonClassName={
        buttonClassName ??
        ((active) =>
          `flex-1 rounded-[7px] px-3 text-body font-semibold transition-colors ${active ? "bg-primary text-onprimary" : "text-muted"}`)
      }
    />
  );
}

/** A lazy panel links to its selected tab. Hidden placeholders keep every
 * aria-controls target valid without mounting inactive forms or fetching twice. */
export function TabPanel({ children, values }: { children: ReactNode; values: readonly string[] }) {
  const { id, value, panelRef, minHeight, stabilize } = useTabs();
  return (
    <>
      {values
        .filter((key) => key !== value)
        .map((key) => (
          <div
            key={key}
            hidden
            role="tabpanel"
            id={`${id}-panel-${key}`}
            aria-labelledby={`${id}-tab-${key}`}
          />
        ))}
      <div
        ref={panelRef}
        role="tabpanel"
        tabIndex={0}
        id={`${id}-panel-${value}`}
        aria-labelledby={`${id}-tab-${value}`}
        style={stabilize ? { minHeight } : undefined}
        className="min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div key={value} className="tab-panel-content">
          {children}
        </div>
      </div>
    </>
  );
}
