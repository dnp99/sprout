"use client";

import {
  Download,
  FileUp,
  Landmark,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { downloadTextFile } from "@/lib/download";
import { SPROUT_TEMPLATE_CSV, SPROUT_TEMPLATE_FILENAME } from "@/lib/import/template";

export function DesktopImportLanding({ onFile }: { onFile: (file: File | undefined) => void }) {
  const t = useTranslations("importer");

  return (
    <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_300px] xl:grid-cols-[minmax(0,1.15fr)_320px]">
      <div className="flex flex-col rounded-[24px] border border-edge bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[.05em] text-primary-dark">
            {t("csvImport")}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[.08em] text-subtle">
            {t("anyBank")}
          </span>
        </div>

        <div className="flex flex-col items-center pt-8 text-center">
          <span className="flex h-[68px] w-[68px] items-center justify-center rounded-[18px] bg-track text-muted">
            <FileUp size={30} strokeWidth={1.8} />
          </span>
          <div className="mt-5 text-[26px] font-bold tracking-[-.03em] text-ink">
            {t("dropTitle")}
          </div>
          <div className="mt-2 max-w-[34rem] text-[14px] font-medium leading-relaxed text-muted">
            {t("dropBody")}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <label
              htmlFor="desktop-csv-upload"
              className="flex min-h-11 cursor-pointer items-center rounded-[12px] bg-primary px-5 text-[13px] font-semibold text-onprimary"
            >
              {t("browse")}
            </label>
            <button
              type="button"
              onClick={() => downloadTextFile(SPROUT_TEMPLATE_FILENAME, SPROUT_TEMPLATE_CSV)}
              className="flex min-h-11 items-center gap-2 rounded-[12px] border border-edge bg-card px-4 text-[13px] font-semibold text-primary transition hover:border-soft-border"
            >
              <Download size={16} strokeWidth={2} /> {t("downloadTemplate")}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-2 sm:grid-cols-3">
          <UploadHint title={t("hintMonarchTitle")} body={t("hintMonarchBody")} />
          <UploadHint title={t("hintPreviewTitle")} body={t("hintPreviewBody")} />
          <UploadHint title={t("hintDupTitle")} body={t("hintDupBody")} />
        </div>

        <input
          id="desktop-csv-upload"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0])}
        />
      </div>

      <aside className="grid gap-4">
        <ImportInfoPanel title={t("howItWorks")}>
          <StepRow step="1" title={t("step1Title")} body={t("step1Body")} />
          <StepRow step="2" title={t("step2Title")} body={t("step2Body")} />
          <StepRow step="3" title={t("step3Title")} body={t("step3Body")} />
        </ImportInfoPanel>

        <ImportInfoPanel title={t("smartImport")}>
          <CapabilityRow
            icon={<Landmark size={16} strokeWidth={2} />}
            title={t("capBankTitle")}
            body={t("capBankBody")}
          />
          <CapabilityRow
            icon={<Sparkles size={16} strokeWidth={2} />}
            title={t("capAiTitle")}
            body={t("capAiBody")}
          />
          <CapabilityRow
            icon={<Tags size={16} strokeWidth={2} />}
            title={t("rulesTitle")}
            body={t("rulesBody")}
          />
          <CapabilityRow
            icon={<SlidersHorizontal size={16} strokeWidth={2} />}
            title={t("capAmountsTitle")}
            body={t("capAmountsBody")}
          />
          <CapabilityRow
            icon={<ShieldCheck size={16} strokeWidth={2} />}
            title={t("capDupTitle")}
            body={t("capDupBody")}
          />
        </ImportInfoPanel>
      </aside>
    </div>
  );
}

export function ImportInfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-edge bg-card p-5">
      <div className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">{title}</div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function UploadHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[14px] border border-edge bg-track/30 p-3 text-left">
      <div className="text-[12.5px] font-semibold text-ink">{title}</div>
      <div className="mt-1 text-[11.5px] font-medium leading-relaxed text-muted">{body}</div>
    </div>
  );
}

function StepRow({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary-dark">
        {step}
      </span>
      <div>
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted">{body}</div>
      </div>
    </div>
  );
}

function CapabilityRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-track text-primary">
        {icon}
      </span>
      <div>
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted">{body}</div>
      </div>
    </div>
  );
}
