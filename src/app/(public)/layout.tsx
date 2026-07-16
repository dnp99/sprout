import { RootDocument, sharedMetadata, sharedViewport } from "../root-document";

// Marketing + legal pages stay English in v1 (plan 013 decision #4) — no
// translation provider, `lang` fixed. The authenticated app lives in the
// sibling `(localized)` group.
export const metadata = sharedMetadata;
export const viewport = sharedViewport;

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument lang="en-CA">{children}</RootDocument>;
}
