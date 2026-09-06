import type { MetadataRoute } from "next";

/** PWA manifest — makes Sprout installable to a phone home screen. App Router
 *  serves this at /manifest.webmanifest and links it automatically. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sprout — Budget",
    short_name: "Sprout",
    description: "A friendly personal budgeting app.",
    id: "/",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d9714e",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/pwa/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
