#!/usr/bin/env node
/**
 * Compose App Store screenshots from raw device captures.
 *
 * 1. Capture each screen from iPhone 17 Pro Max simulator (Cmd+S) — or from
 *    a real iPhone 16 Pro Max — at the native 1320x2868 resolution.
 * 2. Save them as assets/screenshots/raw/{01..05}.png matching the SHOTS table.
 * 3. Run `npm run screenshots`. Designed PNGs land in
 *    assets/screenshots/final/ ready to upload to App Store Connect.
 */

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RAW_DIR = join(ROOT, 'assets/screenshots/raw');
const OUT_DIR = join(ROOT, 'assets/screenshots/final');

const W = 1320;
const H = 2868;
const BG_TOP = '#EFDDC0';
const BG_BOTTOM = '#D9BF94';
const FG = '#2A1F12';
const FG_DIM = '#5D4A33';
const ACCENT = '#9B4F1E';
const BORDER = 'rgba(42,31,18,0.22)';
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const SHOTS = [
  {
    src: '01.png',
    head: ['Block apps.', 'Reclaim hours.'],
    sub: 'On the schedule you choose.',
    badge: 'On-device  ·  Open source  ·  No account',
  },
  {
    src: '02.png',
    head: ['You pick.', 'They go quiet.'],
    sub: 'Apps, websites, whole categories.',
  },
  {
    src: '03.png',
    head: ['Stays gone', 'till you said.'],
    sub: 'No willpower games. No surprise undos.',
  },
  {
    src: '04.png',
    head: ['Stronger than', 'impulses.'],
    sub: 'An optional strict mode that even you can’t undo.',
  },
  {
    src: '05.png',
    head: ['Edits when', 'you scheduled.'],
    sub: 'A weekly review window. Otherwise, locked.',
  },
];

const SHOT_W = 1080;
const SHOT_X = Math.round((W - SHOT_W) / 2);
const SHOT_Y = 560;
const RADIUS = 44;
const CAPTION_TOP = 80;
const CAPTION_H = 460;
const HEAD_FONT_PX = 110;
const HEAD_LINE_GAP = 120;
const SUB_FONT_PX = 44;
const BADGE_FONT_PX = 32;

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
}

function backgroundSvg() {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${BG_TOP}"/>
        <stop offset="100%" stop-color="${BG_BOTTOM}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
  </svg>`;
}

function captionSvg(shot) {
  const head1Base = 125;
  const head2Base = head1Base + HEAD_LINE_GAP;
  const subBase = head2Base + 80;
  const badgeBase = subBase + 85;
  const badgeBoxW = 880;
  const badgeBoxH = 70;
  const badgeBoxX = (W - badgeBoxW) / 2;
  const badgeBoxY = badgeBase - 50;
  const badge = shot.badge
    ? `
    <rect x="${badgeBoxX}" y="${badgeBoxY}" width="${badgeBoxW}" height="${badgeBoxH}"
          rx="${badgeBoxH / 2}" ry="${badgeBoxH / 2}"
          fill="${ACCENT}" fill-opacity="0.14"/>
    <text x="50%" y="${badgeBase}" text-anchor="middle"
          font-family='${FONT}' font-weight="600" font-size="${BADGE_FONT_PX}"
          fill="${ACCENT}" letter-spacing="0.4">${escapeXml(shot.badge)}</text>`
    : '';
  return `<svg width="${W}" height="${CAPTION_H}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="${head1Base}" text-anchor="middle"
          font-family='${FONT}' font-weight="800" font-size="${HEAD_FONT_PX}"
          fill="${FG}" letter-spacing="-3">${escapeXml(shot.head[0])}</text>
    <text x="50%" y="${head2Base}" text-anchor="middle"
          font-family='${FONT}' font-weight="800" font-size="${HEAD_FONT_PX}"
          fill="${FG}" letter-spacing="-3">${escapeXml(shot.head[1])}</text>
    <text x="50%" y="${subBase}" text-anchor="middle"
          font-family='${FONT}' font-weight="400" font-size="${SUB_FONT_PX}"
          fill="${FG_DIM}" letter-spacing="-0.3">${escapeXml(shot.sub)}</text>
    ${badge}
  </svg>`;
}

function shadowSvg(h) {
  return `<svg width="${SHOT_W + 160}" height="${h + 160}" xmlns="http://www.w3.org/2000/svg">
    <rect x="80" y="100" width="${SHOT_W}" height="${h}" rx="${RADIUS}" ry="${RADIUS}" fill="#000000" opacity="0.16"/>
  </svg>`;
}

function maskSvg(h) {
  return `<svg width="${SHOT_W}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${RADIUS}" ry="${RADIUS}" fill="#FFFFFF"/>
  </svg>`;
}

function strokeSvg(h) {
  return `<svg width="${SHOT_W}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="${SHOT_W - 2}" height="${h - 2}"
          rx="${RADIUS}" ry="${RADIUS}"
          fill="none" stroke="${BORDER}" stroke-width="2"/>
  </svg>`;
}

async function compose(shot) {
  const rawPath = join(RAW_DIR, shot.src);
  const screenshot = await sharp(rawPath).resize({ width: SHOT_W }).toBuffer();
  const meta = await sharp(screenshot).metadata();
  const actualH = meta.height;
  const rounded = await sharp(screenshot)
    .composite([{ input: Buffer.from(maskSvg(actualH)), blend: 'dest-in' }])
    .png()
    .toBuffer();
  const framed = await sharp(rounded)
    .composite([{ input: Buffer.from(strokeSvg(actualH)), top: 0, left: 0 }])
    .png()
    .toBuffer();
  const shadow = await sharp(Buffer.from(shadowSvg(actualH)))
    .blur(60)
    .png()
    .toBuffer();
  const background = await sharp(Buffer.from(backgroundSvg())).png().toBuffer();

  await sharp(background)
    .composite([
      { input: Buffer.from(captionSvg(shot)), top: CAPTION_TOP, left: 0 },
      { input: shadow, top: SHOT_Y - 80, left: SHOT_X - 80 },
      { input: framed, top: SHOT_Y, left: SHOT_X },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(OUT_DIR, shot.src));

  console.log(`  ✓ ${shot.src}  "${shot.head.join(' ')}"`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(RAW_DIR, { recursive: true });

  const present = SHOTS.filter((s) => existsSync(join(RAW_DIR, s.src)));
  const missing = SHOTS.filter((s) => !existsSync(join(RAW_DIR, s.src)));

  if (present.length === 0) {
    console.log('No raw screenshots yet.\n');
    console.log('Capture from the iPhone 17 Pro Max simulator (Cmd+S in the Simulator menu)');
    console.log(`and save each PNG into ${RAW_DIR} as:\n`);
    for (const s of SHOTS) {
      console.log(`  ${s.src}  →  "${s.head.join(' ')}"`);
    }
    console.log('\nThen re-run: npm run screenshots');
    return;
  }
  if (missing.length > 0) {
    console.log(`Missing ${missing.length}/${SHOTS.length} raw captures, skipping:`);
    for (const s of missing) console.log(`  - ${s.src} (${s.head.join(' ')})`);
    console.log('');
  }

  console.log(`Composing ${present.length} screenshot(s) → ${OUT_DIR}`);
  for (const shot of present) await compose(shot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
