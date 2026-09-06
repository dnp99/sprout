import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { LocaleSync } from "@/i18n/LocaleSync";
import { ToastProvider } from "@/components/ui/Toast";
import { resolveRequestLocale } from "@/i18n/request";
import { StoreProvider } from "@/state/store";
import { RootDocument, sharedMetadata, sharedViewport } from "../root-document";

// The authenticated app + auth gate, rendered in the request-resolved locale
// (plan 013): `sprout-locale-pref` cookie → Accept-Language → en-CA. The store
// is seeded with the same values the server rendered, so hydration can't flash
// a different language.
export const metadata = sharedMetadata;
export const viewport = sharedViewport;

export default async function LocalizedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [{ pref, locale }, messages] = await Promise.all([resolveRequestLocale(), getMessages()]);

  return (
    <RootDocument lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <StoreProvider initialLocalePref={pref} initialLocale={locale}>
          <LocaleSync pref={pref} locale={locale} />
          <ToastProvider>{children}</ToastProvider>
        </StoreProvider>
      </NextIntlClientProvider>
    </RootDocument>
  );
}
