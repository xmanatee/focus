# Focus Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a polished static landing page for Focus Blocks at `focus.nemi.love`.

**Architecture:** Keep the site as static files under `site/`, matching the current GitHub Pages deployment. Use a shared stylesheet for landing, support, and privacy pages; use local screenshot/icon assets so the page has no runtime third-party dependencies.

**Tech Stack:** HTML, CSS, GitHub Pages, local PNG assets, Playwright/browser verification.

---

### Task 1: Shared Site Styling And Domain

**Files:**
- Create: `site/styles.css`
- Create: `site/CNAME`
- Modify: `site/index.html`
- Modify: `site/support/index.html`
- Modify: `site/privacy/index.html`

- [x] **Step 1: Create shared stylesheet**

Move the current warm Focus Blocks palette into `site/styles.css`, using CSS variables for light/dark mode, responsive layout, focus states, cards, buttons, device preview, FAQ, and footer.

- [x] **Step 2: Add custom domain**

Create `site/CNAME` with exactly:

```text
focus.nemi.love
```

- [x] **Step 3: Link shared stylesheet**

Replace inline CSS in `site/index.html`, `site/support/index.html`, and `site/privacy/index.html` with:

```html
<link rel="stylesheet" href="/styles.css">
```

Use relative links where needed for local `file://` preview compatibility.

### Task 2: Landing Page Content

**Files:**
- Modify: `site/index.html`

- [x] **Step 1: Add SEO and social metadata**

Add a focused title, description, canonical URL, Open Graph tags, Twitter card tags, app icon preview, and JSON-LD `SoftwareApplication` data.

- [x] **Step 2: Build page structure**

Create sections for hero, app preview, benefits, how it works, privacy, daily budgets, strict Lock-in, FAQ, and footer.

- [x] **Step 3: Use real assets**

Use `assets/icon.png` for brand preview and optimized WebP previews generated from `assets/screenshots/raw/01.png` and `assets/screenshots/raw/02.png`.

- [x] **Step 4: Add App Store CTA**

Link the primary CTA to:

```text
https://apps.apple.com/app/focus-blocks-apps-blocker/id6763754394
```

Use a text/button CTA rather than an unofficial App Store badge asset.

### Task 3: Support And Privacy Polish

**Files:**
- Modify: `site/support/index.html`
- Modify: `site/privacy/index.html`

- [x] **Step 1: Refresh support copy**

Add daily budgets, schedule plus budget, new-device app selection, and app deletion troubleshooting.

- [x] **Step 2: Refresh metadata**

Add title, description, canonical, and Open Graph metadata to support and privacy pages.

- [x] **Step 3: Preserve privacy claims**

Keep the no account, no analytics, no server, iCloud-only remote storage claims exactly aligned with the app and App Store review notes.

### Task 4: Verification

**Files:**
- Test: `site/index.html`
- Test: `site/support/index.html`
- Test: `site/privacy/index.html`

- [x] **Step 1: Run repo checks**

Run:

```sh
npm run lint
npm run check-lines
npm test
```

- [x] **Step 2: Serve static site**

Run a local static server from `site/`, open the landing page, and inspect desktop/mobile screenshots.

- [x] **Step 3: Validate page quality**

Check that:
- No horizontal scroll at mobile width.
- All interactive elements have visible focus styles.
- Text is readable in light and dark color schemes.
- App imagery has stable dimensions and alt text.
- Support and privacy pages still navigate from the landing page.

- [x] **Step 4: Commit and push**

Commit the landing-page work and push `main`, then verify the Pages workflow starts.
