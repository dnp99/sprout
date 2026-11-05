import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { SPROUT_ICON_PATHS } from "../src/lib/appearance/icon-mark";
import { INSTALL_ICON_BACKGROUND, INSTALL_ICON_FOREGROUND } from "../src/lib/pwa/branding";

// Use Next's bundled sharp dependency without a second image-rendering stack.
const require = createRequire(import.meta.url);
const sharp = require("sharp") as typeof import("sharp");
const directory = new URL("../public/pwa/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const [name, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
] as const) {
  // Full bleed for maskable artwork. The centered mark fits safely inside the
  // central 80%-diameter circle under circular/squircle platform masks.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="${maskable ? 0 : 15}" fill="${INSTALL_ICON_BACKGROUND}"/><g transform="translate(12 12) scale(1.667)" fill="none" stroke="${INSTALL_ICON_FOREGROUND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SPROUT_ICON_PATHS.map((path) => `<path d="${path}"/>`).join("")}</g></svg>`;
  await writeFile(
    new URL(name, directory),
    await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer(),
  );
  process.stdout.write(`Generated ${name} (${size}px)\n`);
}
