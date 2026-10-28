"use client";

import { useTranslations } from "next-intl";
import { ActivationChecklist } from "@/components/shared/ActivationChecklist";
import { useActivationItems } from "@/components/shared/useActivationItems";

/** Tutorials remain available after Home stops showing completed onboarding. */
export function GettingStartedPanel({ mobile = false }: { mobile?: boolean }) {
  const t = useTranslations("checklist");
  const items = useActivationItems(mobile);
  return (
    <section className="rounded-card border border-edge bg-card p-4">
      <h2 className="text-[15px] font-bold">{t("learningTitle")}</h2>
      <details className="mt-3 rounded-[12px] bg-track p-3">
        <summary className="cursor-pointer text-[13px] font-semibold">{t("tutorialMode")}</summary>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">{t("tutorialBody")}</p>
        <ol className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={item.onClick}
                className="min-h-11 w-full rounded-[10px] px-2 text-left text-[13px] font-medium hover:bg-card"
              >
                {i + 1}. {item.label}
              </button>
            </li>
          ))}
        </ol>
      </details>
      <ActivationChecklist
        items={items}
        hideWhenComplete={false}
        initiallyExpanded
        className="mt-3"
      />
    </section>
  );
}
