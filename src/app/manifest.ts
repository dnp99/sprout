import { INSTALL_ICON_BACKGROUND, INSTALL_ICON_VERSION } from "@/lib/pwa/branding";
import type { MetadataRoute } from "next";

/** PWA manifest — makes Sprout installable to a phone home screen. App Router
 *  serves this at /manifest.webmanifest and links it automatically. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sprout — Budget",
    short_name: "Sprout",
    description: "Friendly budgeting for personal and shared finances.",
    id: "/",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: INSTALL_ICON_BACKGROUND,
    theme_color: INSTALL_ICON_BACKGROUND,
    icons: [
      {
        src: `/pwa/icon-192.png?v=${INSTALL_ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/pwa/icon-512.png?v=${INSTALL_ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/pwa/icon-maskable-512.png?v=${INSTALL_ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: `/apple-icon?v=${INSTALL_ICON_VERSION}`, sizes: "180x180", type: "image/png" },
    ],
  };
}
