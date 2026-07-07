/**
 * Regenerate the PWA icons from icon-source.svg using sharp.
 *
 *   node scripts/gen-icons.mjs
 *
 * - icon-192.png / icon-512.png  → rounded corners (transparent). These are the manifest `any`
 *   icons and what the PWA splash screen shows, so the cream splash background shows through the
 *   corners → the icon reads as a rounded app icon instead of a hard square.
 * - icon-maskable-512.png        → full-bleed opaque square. The Android adaptive (maskable) icon;
 *   the OS applies its own mask, so it must NOT have transparent corners.
 * - apple-touch-icon.png is intentionally NOT regenerated here: iOS renders transparency as black
 *   and rounds the home-screen icon itself, so it must stay an opaque square.
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PUB = join(ROOT, "public");
const svg = readFileSync(join(ROOT, "icon-source.svg"));

// ~iOS app-icon corner radius (superellipse ≈ 22.37% of the side).
const roundedMask = (size) => {
  const r = Math.round(size * 0.22);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`,
  );
};

// Supersample the SVG (density) then downscale for clean anti-aliasing.
const render = (size) => sharp(svg, { density: 384 }).resize(size, size).png();

async function rounded(size, out) {
  const base = await render(size).toBuffer();
  await sharp(base)
    .composite([{ input: roundedMask(size), blend: "dest-in" }])
    .png()
    .toFile(join(PUB, out));
}

async function square(size, out) {
  await render(size).toFile(join(PUB, out));
}

await rounded(192, "icon-192.png");
await rounded(512, "icon-512.png");
await square(512, "icon-maskable-512.png");
console.log("Icons regenerated: icon-192.png, icon-512.png (rounded), icon-maskable-512.png (square).");
