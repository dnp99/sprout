import { SPROUT_ICON_PATHS } from "@/lib/appearance/icon-mark";
import { INSTALL_ICON_BACKGROUND, INSTALL_ICON_FOREGROUND } from "@/lib/pwa/branding";
import { ImageResponse } from "next/og";

// iOS home-screen icon — a real 180×180 PNG generated from the same sprout mark
// as icon.svg (iOS applies its own rounded mask, so a full-bleed tile is fine).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: INSTALL_ICON_BACKGROUND,
      }}
    >
      <svg
        width="118"
        height="118"
        viewBox="0 0 24 24"
        fill="none"
        stroke={INSTALL_ICON_FOREGROUND}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {SPROUT_ICON_PATHS.map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    </div>,
    { ...size },
  );
}
