import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Cookie-preference i18n (plan 013) — the request config resolves the locale
// per request; there is no locale segment in URLs.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    // Apply to HTML and RSC navigations as well as APIs. Versioned static assets
    // keep Next's immutable caching; financial documents must not survive login changes.
    return [
      "/push-sw.js",
      "/api/:path*",
      "/home",
      "/transactions",
      "/categories",
      "/trends",
      "/goals",
      "/bills",
      "/import",
      "/settings",
      "/groups/:path*",
      "/login",
      "/logout",
      "/forgot-password",
      "/reset-password",
    ].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    }));
  },
  devIndicators: false,
};

export default withNextIntl(nextConfig);
