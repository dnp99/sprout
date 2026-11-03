"use client";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Select } from "@/components/ui/Select";
import { businessActivity, NO_BUSINESS } from "@/lib/businesses/activity";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

/** One business scope is shared across desktop, phone browsing and search. */
export function BusinessFilter() {
  const t = useTranslations("businessActivity");
  const businesses = useStore((s) => s.businesses);
  const id = useStore((s) => s.txnBusinessId);
  const period = useStore((s) => s.txnBusinessPeriod);
  const set = useStore((s) => s.set);
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <Select
        aria-label={t("filter")}
        value={id}
        onChange={(e) => set({ txnBusinessId: e.target.value })}
        className={`min-h-11 max-w-full rounded-[10px] border px-3 py-2 text-[13px] font-medium text-ink outline-none focus:border-primary ${id !== "all" ? "border-primary bg-primary-soft" : "border-edge bg-card"}`}
      >
        <option value="all">{t("allBusinesses")}</option>
        <option value={NO_BUSINESS}>{t("noBusiness")}</option>
        {id && id !== "all" && id !== NO_BUSINESS && !businesses.some((b) => b.id === id) && (
          <option value={id}>{t("unavailable")}</option>
        )}
        {businesses.map((b) => (
          <option key={b.id} value={b.id} data-icon={b.emoji}>
            {b.name}
          </option>
        ))}
      </Select>
      {id !== "all" && (
        <Select
          aria-label={t("period")}
          value={period}
          onChange={(e) =>
            set({
              txnBusinessPeriod: e.target.value === "all" ? "all" : "month",
              webDateFrom: "",
              webDateTo: "",
              searchDateFrom: "",
              searchDateTo: "",
            })
          }
          className="min-h-11 rounded-[10px] border border-edge bg-card px-3 py-2 text-[13px] font-medium text-ink outline-none focus:border-primary"
        >
          <option value="month">{t("selectedMonth")}</option>
          <option value="all">{t("allDates")}</option>
        </Select>
      )}
    </div>
  );
}

/** Summary uses the visible result set and never reports a partial or failed load as zero activity. */
export function BusinessActivitySummary({ rows }: { rows: Transaction[] }) {
  const t = useTranslations("businessActivity");
  const id = useStore((s) => s.txnBusinessId);
  const businesses = useStore((s) => s.businesses);
  const ledger = useStore((s) => s.businessLedger);
  const load = useStore((s) => s.loadBusinessLedger);
  const locale = useStore((s) => s.locale);
  if (!id || id === "all") return null;
  const loading = !ledger || ledger.id !== id || ledger.loading;
  const error = ledger?.id === id && ledger.error;
  const totals = businessActivity(rows);
  const name =
    id === NO_BUSINESS
      ? t("noBusiness")
      : (businesses.find((b) => b.id === id)?.name ?? t("unavailable"));
  return (
    <section
      aria-label={t("summary", { name })}
      aria-busy={loading}
      className="rounded-[14px] border border-edge bg-card p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">{name}</h2>
        <span className="text-xs text-muted">
          {loading ? (
            <>
              <LoadingIndicator size={16} /> {t("loading")}
            </>
          ) : error ? (
            "—"
          ) : (
            t("matching", { count: rows.length })
          )}
        </span>
      </div>
      {error ? (
        <div role="alert" className="mt-2 text-sm text-danger">
          {t("loadFailed")}{" "}
          <button
            type="button"
            onClick={() => void load(id, true)}
            className="min-h-11 px-2 font-semibold underline"
          >
            {t("retry")}
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["incomeCents", "expenseCents", "netCents"] as const).map((key) => (
            <div key={key} className="min-w-0 rounded-[10px] bg-track p-2.5">
              <p className="text-[11px] font-medium text-muted">{t(key)}</p>
              <p className="mt-1 break-words text-[14px] font-semibold tabular-nums text-ink sm:text-[18px]">
                {loading ? "—" : formatMoney(totals[key], { locale, signed: key === "netCents" })}
              </p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        {loading ? t("loading") : t("totalsHint")}
      </p>
    </section>
  );
}
