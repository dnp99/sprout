import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Cookie-preference i18n (plan 013) — the request config resolves the locale
// per request; there is no locale segment in URLs.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
};

export default withNextIntl(nextConfig);
