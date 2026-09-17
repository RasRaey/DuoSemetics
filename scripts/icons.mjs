/**
 * Generates the app icons and the iOS launch images.
 *
 * Kept as a script rather than checked-in binaries alone so the artwork can be
 * regenerated from one source of truth: `lion()` below is the same geometry the
 * Mascot component draws.
 *
 *   node scripts/icons.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/icons');

const GREEN = '#46be4c';
const GREEN_DARK = '#2f8f36';
const MANE = '#f0a92c';
const FACE = '#ffd98a';
const MUZZLE = '#fff0cd';

/** Anbi's head, drawn in a 120x120 box. */
function lion() {
  const ring = (r, count, radius, phase = 0) =>
    Array.from({ length: count }, (_, i) => {
      const a = ((i + phase) / count) * Math.PI * 2;
      return `<circle cx="${(60 + Math.cos(a) * r).toFixed(2)}" cy="${(62 + Math.sin(a) * r).toFixed(2)}" r="${radius}" fill="${MANE}"/>`;
    }).join('');

  return `
    ${ring(34, 12, 14)}
    ${ring(28, 12, 15, 0.5)}
    <circle cx="36" cy="36" r="10" fill="${MANE}"/>
    <circle cx="84" cy="36" r="10" fill="${MANE}"/>
    <circle cx="36" cy="36" r="5" fill="#e07b52"/>
    <circle cx="84" cy="36" r="5" fill="#e07b52"/>
    <circle cx="60" cy="62" r="31" fill="${FACE}"/>
    <ellipse cx="60" cy="74" rx="19" ry="14" fill="${MUZZLE}"/>
    <path d="M42 60 q7 -8 14 0" stroke="#3b2a17" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    <path d="M64 60 q7 -8 14 0" stroke="#3b2a17" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    <path d="M55 68 q5 -4 10 0 q-3 5 -5 5 q-2 0 -5 -5 z" fill="#c9603f"/>
    <path d="M48 76 q12 14 24 0 q-12 5 -24 0z" fill="#8a4a2e" stroke="#8a4a2e" stroke-width="3.2" stroke-linejoin="round"/>
    <g stroke="#d8b06f" stroke-width="2" stroke-linecap="round">
      <path d="M38 72 h-9"/><path d="M39 78 h-8"/>
      <path d="M82 72 h9"/><path d="M81 78 h8"/>
    </g>`;
}

/** `pad` is the fraction of the canvas left empty around the lion. */
function iconSvg({ size = 512, pad = 0.12, rounded = true } = {}) {
  const inner = size * (1 - pad * 2);
  const scale = inner / 120;
  const r = rounded ? size * 0.22 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GREEN}"/>
      <stop offset="1" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <g transform="translate(${size * pad} ${size * pad}) scale(${scale})">${lion()}</g>
</svg>`;
}

/** Launch image: the icon centred on a flat field, at device resolution. */
function splashSvg(w, h, dark) {
  const bg = dark ? '#131b19' : '#ffffff';
  const mark = Math.min(w, h) * 0.34;
  const scale = mark / 120;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <g transform="translate(${(w - mark) / 2} ${(h - mark) / 2 - h * 0.05}) scale(${scale})">${lion()}</g>
  <text x="${w / 2}" y="${h / 2 + mark * 0.9}" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="700"
    font-size="${Math.round(Math.min(w, h) * 0.055)}" fill="${dark ? '#eef5f2' : '#23342f'}">DuoSemetics</text>
</svg>`;
}

const png = (svg, file, w, h = w) =>
  sharp(Buffer.from(svg)).resize(w, h).png({ compressionLevel: 9 }).toFile(resolve(out, file));

await mkdir(out, { recursive: true });

// The SVG favicon is served as-is; browsers scale it themselves.
await writeFile(resolve(out, 'icon.svg'), iconSvg({ size: 512 }));

await Promise.all([
  png(iconSvg({ size: 512 }), 'icon-180.png', 180),
  png(iconSvg({ size: 512 }), 'icon-192.png', 192),
  png(iconSvg({ size: 512 }), 'icon-512.png', 512),
  // Maskable icons get cropped to a circle by some launchers, so the artwork
  // sits inside a safe zone with no corner rounding of its own.
  png(iconSvg({ size: 512, pad: 0.22, rounded: false }), 'icon-maskable-512.png', 512),
  // iPhone 15 Pro Max, portrait, @3x.
  png(splashSvg(1290, 2796, false), 'splash-1290x2796.png', 1290, 2796),
  png(splashSvg(1290, 2796, true), 'splash-1290x2796-dark.png', 1290, 2796),
]);

console.log('icons written to public/icons');
