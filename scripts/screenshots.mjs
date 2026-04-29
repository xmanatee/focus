#!/usr/bin/env node
/**
 * Compose App Store screenshots from raw device captures.
 * Updated for April 2026 standards: iPhone 17 Pro Max (6.9"), iPad Pro 13".
 * Preserves both iPhone and iPad sets using separate raw directories.
 */

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RAW_DIR = join(ROOT, 'assets/screenshots/raw');
const RAW_IPAD_DIR = join(ROOT, 'assets/screenshots/raw-ipad');
const OUT_DIR = join(ROOT, 'assets/screenshots/final');

const SIZES = [
  { name: '6.9', w: 1320, h: 2868, type: 'phone', raw: RAW_DIR },
  { name: '6.7', w: 1284, h: 2778, type: 'phone', raw: RAW_DIR },
  { name: '6.5', w: 1242, h: 2688, type: 'phone', raw: RAW_DIR },
  { name: 'iPad-13', w: 2064, h: 2752, type: 'tablet', raw: RAW_IPAD_DIR },
  { name: 'iPad-12.9', w: 2048, h: 2732, type: 'tablet', raw: RAW_IPAD_DIR },
];

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

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
}

function backgroundSvg(W, H) {
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

function captionSvg(shot, W, CAPTION_H, HEAD_FONT_PX, HEAD_LINE_GAP, SUB_FONT_PX, BADGE_FONT_PX, type) {
  const baseWidth = type === 'tablet' ? 2064 : 1320;
  const scale = W / baseWidth;
  
  const head1Base = (type === 'tablet' ? 140 : 125) * scale;
  const head2Base = head1Base + HEAD_LINE_GAP;
  const subBase = head2Base + (type === 'tablet' ? 90 : 80) * scale;
  const badgeBase = subBase + (type === 'tablet' ? 100 : 85) * scale;
  
  const badgeBoxW = (type === 'tablet' ? 1200 : 880) * scale;
  const badgeBoxH = (type === 'tablet' ? 80 : 70) * scale;
  const badgeBoxX = (W - badgeBoxW) / 2;
  const badgeBoxY = badgeBase - (type === 'tablet' ? 60 : 50) * scale;
  
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

function shadowSvg(SHOT_W, h, RADIUS) {
  return `<svg width="${SHOT_W + 160}" height="${h + 160}" xmlns="http://www.w3.org/2000/svg">
    <rect x="80" y="100" width="${SHOT_W}" height="${h}" rx="${RADIUS}" ry="${RADIUS}" fill="#000000" opacity="0.16"/>
  </svg>`;
}

function maskSvg(SHOT_W, h, RADIUS) {
  return `<svg width="${SHOT_W}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${RADIUS}" ry="${RADIUS}" fill="#FFFFFF"/>
  </svg>`;
}

function strokeSvg(SHOT_W, h, RADIUS) {
  return `<svg width="${SHOT_W}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="${SHOT_W - 2}" height="${h - 2}"
          rx="${RADIUS}" ry="${RADIUS}"
          fill="none" stroke="${BORDER}" stroke-width="2"/>
  </svg>`;
}

async function compose(shot, size, outDir) {
  const { w: W, h: H, raw: rawDir, type } = size;
  const baseWidth = type === 'tablet' ? 2064 : 1320;
  const scale = W / baseWidth;

  // Visual constants tuned for the primary canvases
  const SHOT_W = Math.round((type === 'tablet' ? 1600 : 1080) * scale);
  const SHOT_X = Math.round((W - SHOT_W) / 2);
  const SHOT_Y = Math.round((type === 'tablet' ? 480 : 560) * scale);
  const RADIUS = Math.round(44 * scale);
  const CAPTION_TOP = Math.round(80 * scale);
  const CAPTION_H = Math.round((type === 'tablet' ? 440 : 460) * scale);
  const HEAD_FONT_PX = Math.round((type === 'tablet' ? 120 : 110) * scale);
  const HEAD_LINE_GAP = Math.round((type === 'tablet' ? 130 : 120) * scale);
  const SUB_FONT_PX = Math.round((type === 'tablet' ? 48 : 44) * scale);
  const BADGE_FONT_PX = Math.round((type === 'tablet' ? 36 : 32) * scale);

  const rawPath = join(rawDir, shot.src);
  if (!existsSync(rawPath)) return;

  const rawMeta = await sharp(rawPath).metadata();
  if (rawMeta.width < SHOT_W) {
    console.warn(
      `  ! [${size.name}] Skipping ${shot.src}: Raw image is too small (${rawMeta.width}px) to resize to ${SHOT_W}px.`,
    );
    return;
  }

  const screenshot = await sharp(rawPath).resize({ width: SHOT_W }).toBuffer();
  const meta = await sharp(screenshot).metadata();
  const actualH = meta.height;

  if (actualH > H - SHOT_Y) {
    console.warn(`  ! [${size.name}] Warning: ${shot.src} might be too tall.`);
  }

  const rounded = await sharp(screenshot)
    .composite([{ input: Buffer.from(maskSvg(SHOT_W, actualH, RADIUS)), blend: 'dest-in' }])
    .png()
    .toBuffer();
  const framed = await sharp(rounded)
    .composite([{ input: Buffer.from(strokeSvg(SHOT_W, actualH, RADIUS)), top: 0, left: 0 }])
    .png()
    .toBuffer();
  const shadow = await sharp(Buffer.from(shadowSvg(SHOT_W, actualH, RADIUS)))
    .blur(Math.round(60 * scale))
    .png()
    .toBuffer();
  const background = await sharp(Buffer.from(backgroundSvg(W, H))).png().toBuffer();

  await sharp(background)
    .composite([
      {
        input: Buffer.from(
          captionSvg(shot, W, CAPTION_H, HEAD_FONT_PX, HEAD_LINE_GAP, SUB_FONT_PX, BADGE_FONT_PX, type),
        ),
        top: CAPTION_TOP,
        left: 0,
      },
      { input: shadow, top: SHOT_Y - Math.round(80 * scale), left: SHOT_X - Math.round(80 * scale) },
      { input: framed, top: SHOT_Y, left: SHOT_X },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, shot.src));

  console.log(`  ✓ [${size.name}] ${shot.src}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(RAW_IPAD_DIR, { recursive: true });

  for (const size of SIZES) {
    const present = SHOTS.filter((s) => existsSync(join(size.raw, s.src)));
    if (present.length === 0) {
      console.log(`No raw screenshots found for ${size.name} in ${size.raw}`);
      continue;
    }

    const outDir = join(OUT_DIR, size.name);
    await mkdir(outDir, { recursive: true });
    console.log(`Composing for ${size.name} (${size.w}x${size.h}) → ${outDir}`);
    for (const shot of present) {
      await compose(shot, size, outDir);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
