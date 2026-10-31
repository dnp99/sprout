import { createTranslator } from "next-intl";
import en from "@/messages/en-CA.json";
import fr from "@/messages/fr-CA.json";
import hans from "@/messages/zh-Hans.json";
import hant from "@/messages/zh-Hant.json";
import { isAppLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/format";
import type { GroupNotificationDetails } from "./group-details";

/** Keep names readable and payloads bounded without allowing line breaks to mimic UI chrome. */
const label = (value: string, limit: number) =>
  Array.from(value.replace(/\s+/g, " ").trim()).slice(0, limit).join("");

/** Weekly copy stays generic; authorized group alerts explicitly include transaction details. */
export function notificationCopy(locale: string, details?: GroupNotificationDetails) {
  const resolved = isAppLocale(locale) ? locale : "en-CA";
  const messages =
    resolved === "fr-CA" ? fr : resolved === "zh-Hans" ? hans : resolved === "zh-Hant" ? hant : en;
  const copy = messages.settingsPage.push;
  if (!details) return { title: copy.weeklyTitle, body: copy.weeklyBody };
  const t = createTranslator({ locale: resolved, messages: copy });
  const actor = label(details.actor, 60),
    group = label(details.group, 80);
  if ("count" in details) {
    return {
      title: group,
      body: t(details.action === "imported" ? "importedBody" : "copiedBody", {
        actor,
        count: details.count,
      }),
    };
  }
  const merchant = label(details.merchant, 100);
  const action =
    details.action === "income"
      ? "incomeBody"
      : details.action === "refund"
        ? "refundBody"
        : "expenseBody";
  return {
    title: group,
    body: t(merchant ? action : `${action}NoMerchant`, {
      actor,
      amount: formatMoney(Math.abs(details.amountCents), { locale: resolved, forceCents: true }),
      merchant,
    }),
  };
}
