# App icon & splash concept

## Concept

A typographic "verdict" mark: bold `F` in SF Pro Display Black on near-black
surface, terminated by a signal-orange period. The period is the signature —
a full stop on distraction.

- `icon-concept.svg` — 1024×1024 app icon
- `splash-concept.svg` — full-bleed launch screen

## Rendering to PNG

Apple requires `icon.png` (1024×1024) and a splash image. To render:

```bash
# One-shot, via any SVG renderer. Example using rsvg-convert:
rsvg-convert -w 1024 -h 1024 icon-concept.svg > icon.png

# Or using a headless browser (Chromium):
npx -y svg-to-png icon-concept.svg icon.png 1024 1024
```

Then update `app.json` to point `expo.icon` and `expo.splash.image` at the
rendered files.

The SVGs use system font fallbacks so you can render them on any macOS machine
with SF Pro installed.
