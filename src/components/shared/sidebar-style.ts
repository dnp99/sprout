/** Both ledger rails use the personal navigation's sizing and state treatment. */
export function sidebarItemClass(active: boolean, collapsed = false) {
  return `relative flex min-h-11 w-full items-center rounded-[10px] py-[9px] text-left text-[13.5px] font-medium transition-colors duration-150 ${collapsed ? "justify-center px-2" : "gap-[11px] px-[11px]"} ${active ? "bg-primary-soft text-primary" : "text-muted hover:bg-track"}`;
}
