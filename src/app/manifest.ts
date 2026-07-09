import type { MetadataRoute } from "next";

/** PWA manifest — makes Sprout installable to a phone home screen. App Router
 *  serves this at /manifest.webmanifest and links it automatically. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sprout — Budget",
    short_name: "Sprout",
    description: "A friendly personal budgeting app.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d9714e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
