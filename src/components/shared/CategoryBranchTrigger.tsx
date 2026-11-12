import type { ReactNode } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

/** The whole parent row opens its branch; choosing the parent is a separate
 * option inside that branch, so a small chevron is never the only hit target. */
export function CategoryBranchTrigger({
  label,
  accessibleLabel,
  icon,
  count,
  expanded,
  selected = false,
  controls,
  onToggle,
}: {
  label: string;
  accessibleLabel?: string;
  icon: ReactNode;
  count: number;
  expanded: boolean;
  selected?: boolean;
  controls: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={accessibleLabel ?? label}
      aria-expanded={expanded}
      aria-controls={controls}
      data-category-branch=""
      data-selected={selected}
      onClick={onToggle}
      className={`grid min-h-11 w-full min-w-0 grid-cols-[20px_minmax(0,1fr)_auto_16px] items-center gap-2 rounded-[10px] px-3 py-3 text-left text-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selected ? "bg-primary-soft text-primary" : "text-ink hover:bg-track"}`}
    >
      <span className="flex w-5 items-center justify-center">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex items-center gap-1.5 text-meta text-muted">
        {selected && <Check size={14} aria-hidden="true" />}
        {count}
      </span>
      {expanded ? (
        <ChevronDown size={16} aria-hidden="true" />
      ) : (
        <ChevronRight size={16} aria-hidden="true" />
      )}
    </button>
  );
}
