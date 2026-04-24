# Rename Checklist — `fucus` → `Focus Blocks`

Covers **every place** a rename is required: code, Apple portals, EAS, GitHub, local filesystem. Work top-to-bottom.

## 0. Replacements to apply globally

| Old | New |
|---|---|
| `com.yourbound.fucus` | `love.nemi.focus` |
| `group.com.yourbound.fucus` | `group.love.nemi.focus` |
| `iCloud.com.yourbound.fucus` | `iCloud.love.nemi.focus` |
| `"fucus"` (app.json `slug`, package.json `name`) | `"focus-blocks"` |
| `"name": "fucus"` (app.json display name) | `"name": "Focus Blocks"` |
| `"scheme": "fucus"` (app.json) | `"scheme": "focusblocks"` |
| URL scheme `fucus` in Info.plist | `focusblocks` |
| Xcode target / folder `fucus` | `FocusBlocks` |
| Android Java path `com/yourbound/fucus` | `love/nemi/focus` |

## 1. Code — run `rename.sh` from repo root

`publishing/rename.sh` performs every text-level replacement listed below. Review the script, then run:

```
bash publishing/rename.sh
```

Files it touches (text replacements):

- `app.json` — `name`, `slug`, `scheme`, `bundleIdentifier`, `android.package`, plugin `appGroup`
- `package.json` + `package-lock.json` — `name` field
- `ios/fucus/Info.plist` — URL schemes
- `ios/fucus/fucus.entitlements` — iCloud container, ubiquity KV, App Group
- `ios/fucus.xcodeproj/project.pbxproj` — all `PRODUCT_BUNDLE_IDENTIFIER`, `PRODUCT_NAME`, target names, path refs, `REACT_NATIVE_DEVICE_ACTIVITY_APP_GROUP`
- `ios/fucus.xcodeproj/xcshareddata/xcschemes/fucus.xcscheme` — target refs
- `ios/fucus.xcworkspace/contents.xcworkspacedata` — project ref
- `ios/Podfile` — target name
- `android/app/build.gradle`, `android/settings.gradle`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/java/com/yourbound/fucus/MainActivity.kt`, `MainApplication.kt` — `package` statement
- `targets/ActivityMonitorExtension/*`, `targets/ShieldAction/*`, `targets/ShieldConfiguration/*` — App Group, entitlements
- `plugins/with-fucus-icloud.js` — container identifier inside the plugin body
- `src/**/*.ts`, `src/**/*.tsx` — `"fucus"` storage keys / identifiers
- `app/**/*.tsx` — any literal references
- `docs/*.md`, `PROJECT_MANIFEST.md`, `FUCUS_DESIGN_DOC.md`, `.impeccable.md`, `assets/*.svg` — text mentions

## 2. Directory + file renames — manual

The script does **not** move directories (too risky to script reliably). Do these by hand after the script runs, with Xcode and your editor **closed**:

```
# iOS Xcode project
git mv ios/fucus ios/FocusBlocks
git mv ios/fucus.xcodeproj ios/FocusBlocks.xcodeproj
git mv ios/fucus.xcworkspace ios/FocusBlocks.xcworkspace
git mv ios/FocusBlocks.xcodeproj/xcshareddata/xcschemes/fucus.xcscheme \
       ios/FocusBlocks.xcodeproj/xcshareddata/xcschemes/FocusBlocks.xcscheme
git mv ios/FocusBlocks/fucus.entitlements ios/FocusBlocks/FocusBlocks.entitlements

# Android Java package
git mv android/app/src/main/java/com/yourbound/fucus android/app/src/main/java/love/nemi/focus
# Then remove the now-empty com/yourbound tree:
rmdir android/app/src/main/java/com/yourbound 2>/dev/null
rmdir android/app/src/main/java/com 2>/dev/null

# Config plugin (optional but cleaner)
git mv plugins/with-fucus-icloud.js plugins/with-focus-blocks-icloud.js
# Then update the `plugins` entry in app.json accordingly.

# Design doc
git mv FUCUS_DESIGN_DOC.md FOCUS_BLOCKS_DESIGN_DOC.md
```

## 3. Verify Xcode still opens cleanly

```
open ios/FocusBlocks.xcworkspace
```

In Xcode:
- Top-left scheme dropdown should read `FocusBlocks`. If not: Product → Scheme → Manage Schemes → rename.
- Targets sidebar: confirm `FocusBlocks`, `ActivityMonitorExtension`, `ShieldAction`, `ShieldConfiguration`.
- Signing & Capabilities for each target: Bundle Identifier matches the new scheme (`love.nemi.focus`, `love.nemi.focus.ActivityMonitorExtension`, etc.).
- Product → Clean Build Folder, then Product → Build. Fix any missing-file refs in the file navigator.

## 4. Verify cleanup — zero remaining refs

```
grep -rli --exclude-dir=node_modules --exclude-dir=Pods --exclude-dir=build --exclude-dir=.git 'fucus\|yourbound' .
```

Should return nothing. If it does, review each remaining hit.

## 5. Local working directory

```
cd ..
git mv fucus focus-blocks
cd focus-blocks
```

Update any Claude Code session pinning, IDE bookmarks, or shell aliases that referenced the old path. The CLAUDE.md / AGENTS.md at repo root continue to work — they're path-agnostic.

## 6. GitHub

- `gh repo rename focus-blocks --repo xmanatee/fucus` (or via the GitHub UI: Settings → Rename repository)
- Update local remote: `git remote set-url origin https://github.com/xmanatee/focus-blocks.git`
- If you have CI, open Actions settings to re-auth any tokens that bind to the old repo slug.

## 7. Apple Developer portal (developer.apple.com/account/resources)

You don't delete the old `com.yourbound.fucus` entries — you simply create the new ones. Keeping old IDs costs nothing and avoids accidental re-use conflicts.

| Section | Action |
|---|---|
| Identifiers → App IDs | Create `love.nemi.focus` + `.ActivityMonitorExtension` + `.ShieldAction` + `.ShieldConfiguration` |
| Capabilities on main App ID | iCloud (CloudKit + KV), App Groups, Family Controls |
| Capabilities on each extension ID | App Groups |
| Identifiers → App Groups | Create `group.love.nemi.focus`, assign to all 4 App IDs |
| Identifiers → iCloud Containers | Create `iCloud.love.nemi.focus`, assign to main App ID |
| Certificates, Identifiers & Profiles → Profiles | Leave alone — EAS regenerates on next build |

Detail and screenshots: [apple-setup.md](./apple-setup.md).

## 8. Family Controls entitlement request

New bundle ID means the request letter must reference `love.nemi.focus` and team `569HBLNQPC`. Submit via [apple-setup.md §3](./apple-setup.md#3-family-controls-distribution-request). Do **not** submit before step 7 — the App ID must exist at request time.

## 9. App Store Connect (appstoreconnect.apple.com)

- If you created a record under the old bundle ID, delete it (My Apps → select → App Information → Delete App). You probably haven't — skip if so.
- Create new app: + → New App → bundle ID `love.nemi.focus` → Name `Focus Blocks` → SKU `focus-blocks-ios-2026` → Primary Language.

## 10. EAS / Expo

- If you previously ran `eas init` against the old slug, clean it up: `expo.dev` → Projects → old project → Settings → Delete.
- Re-run `eas init` from the renamed working directory.
- Any stored credentials: `eas credentials` and clear iOS entries for the old bundle ID (EAS will regenerate under the new one).

## 11. Final sanity pass

```
# From the renamed repo root
npm install
npx expo-doctor        # catches stray config mismatches
npm run typecheck
grep -rli --exclude-dir=node_modules --exclude-dir=Pods --exclude-dir=build --exclude-dir=.git 'fucus\|yourbound' .
```

If typecheck is green and grep is empty, commit. Suggested message:

```
chore: rename fucus -> Focus Blocks; bundle id love.nemi.focus
```
