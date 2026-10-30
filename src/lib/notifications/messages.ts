import en from "@/messages/en-CA.json";
import fr from "@/messages/fr-CA.json";
import hans from "@/messages/zh-Hans.json";
import hant from "@/messages/zh-Hant.json";

/** Lock-screen copy deliberately excludes group names, merchants, amounts and member identities. */
export function notificationCopy(locale: string, kind: string) {
  const messages =
    locale === "fr-CA" ? fr : locale === "zh-Hans" ? hans : locale === "zh-Hant" ? hant : en;
  const copy = messages.settingsPage.push;
  return kind === "group"
    ? { title: copy.groupTitle, body: copy.groupBody }
    : { title: copy.weeklyTitle, body: copy.weeklyBody };
}
