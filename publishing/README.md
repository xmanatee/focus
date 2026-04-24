# Publishing — Focus Blocks

Everything needed to rename the app from `fucus` → `Focus Blocks` and ship it to the iOS App Store.

## Target identity

| Field | Value |
|---|---|
| Display name | `Focus Blocks` |
| Slug / repo | `focus-blocks` |
| Bundle ID | `love.nemi.focus` |
| Apple Team ID | `569HBLNQPC` |
| App Group | `group.love.nemi.focus` |
| iCloud Container | `iCloud.love.nemi.focus` |
| URL scheme | `focusblocks` |
| iOS Xcode target / folder | `FocusBlocks` |
| Android package | `love.nemi.focus` |

## Execution order

The **Family Controls distribution entitlement** is the long pole (1–4 weeks, no SLA). Start step 2 the moment step 1 is done.

1. **Rename everything** — [rename-checklist.md](./rename-checklist.md) + [rename.sh](./rename.sh)
2. **Request Family Controls entitlement** — [apple-setup.md §3](./apple-setup.md#3-family-controls-distribution-request)
3. **Apple Developer portal + ASC setup** (parallel with #2) — [apple-setup.md](./apple-setup.md)
4. **First build + TestFlight internal** — [build-and-submit.md](./build-and-submit.md)
5. **Fill App Store listing** — [app-store-listing.md](./app-store-listing.md) + [review-notes.md](./review-notes.md)
6. **Host privacy policy + support page** — [privacy-policy.md](./privacy-policy.md)
7. **Submit for review** — [build-and-submit.md §Submit](./build-and-submit.md#submit-for-review)

Realistic timeline: **3–5 weeks end-to-end**, gated by the Family Controls request. Fastest possible: ~1 week if Apple's Family Controls team replies in 2–3 days.

## Document map

| File | Purpose |
|---|---|
| [rename-checklist.md](./rename-checklist.md) | Every change needed — code, Apple accounts, ASC, EAS, GitHub, local FS |
| [rename.sh](./rename.sh) | Text-level renames across the repo. Directory moves are listed, not scripted |
| [apple-setup.md](./apple-setup.md) | One-time Apple Developer portal + ASC record + Family Controls request |
| [app-store-listing.md](./app-store-listing.md) | Exact copy for every ASC field — name, subtitle, description, keywords, screenshots, privacy answers |
| [review-notes.md](./review-notes.md) | Text to paste into ASC → App Review Information → Notes |
| [privacy-policy.md](./privacy-policy.md) | Host as-is at your privacy-policy URL |
| [build-and-submit.md](./build-and-submit.md) | `eas` commands for build, TestFlight, and submission |
