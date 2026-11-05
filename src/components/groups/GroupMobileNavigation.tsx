"use client";
import { useTranslations } from "next-intl";
import { useMobileNavHeight } from "@/hooks/useMobileNavHeight";
import { Navigation } from "@/components/ui/Navigation";
import { LedgerMobileTabs } from "@/components/shared/LedgerMobileTabs";

/** Keep measured bottom chrome outside the mobile page's scrolling region. */
export function GroupMobileNavigation({
  id,
  tab,
  busy,
  onNavigate,
}: {
  id: string;
  tab: string;
  busy: boolean;
  onNavigate: (target: string) => void;
}) {
  const ref = useMobileNavHeight();
  const t = useTranslations("groups");
  return (
    <Navigation
      layout="mobile"
      ref={ref}
      aria-label={t("groupNavigation")}
      className="mobile-bottom-nav relative z-30 mx-auto w-full max-w-app shrink-0 border-t border-edge bg-card px-2 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-2 lg:hidden"
    >
      <LedgerMobileTabs
        active={tab}
        disabled={busy}
        onSelect={(item) =>
          onNavigate(`/groups/${id}${item.id === "overview" ? "" : `/${item.id}`}`)
        }
      />
    </Navigation>
  );
}
