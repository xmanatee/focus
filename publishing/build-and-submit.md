# Build and Submit

Every `eas` command needed from a clean machine to a binary in App Review. Run from the **renamed** repo root (`focus-blocks/`).

## 0. Prerequisites

- [apple-setup.md](./apple-setup.md) complete (App IDs, App Group, iCloud Container, ASC record, `.p8` API key)
- Rename complete and committed
- `node` ≥ 20, `npm` installed
- Signed-in Apple Developer account (you'll authenticate via browser on first `eas build`)

## 1. Install EAS CLI and link the project

```
npm install -g eas-cli
eas login
eas init          # writes projectId to app.json under expo.extra.eas.projectId
eas credentials   # choose "Let EAS handle it" for all prompts
```

If prompted about the bundle identifier: confirm `love.nemi.focus`. EAS will register a new distribution certificate and provisioning profile against your team.

## 2. Confirm your entitlements made it through

```
eas build:inspect --profile production --platform ios --stage pre-build
```

Check the resolved `*.entitlements` shows:

- `com.apple.developer.family-controls` = true
- `com.apple.developer.icloud-container-identifiers` = `[iCloud.love.nemi.focus]`
- `com.apple.developer.ubiquity-kvstore-identifier` = `$(TeamIdentifierPrefix)$(CFBundleIdentifier)`
- `com.apple.security.application-groups` = `[group.love.nemi.focus]`

If any are missing, stop and fix the root cause in `app.json` or the `with-fucus-icloud` plugin (rename it to `with-focus-blocks-icloud.js` during rename step 2 of the checklist).

## 3. First production build

**Only proceed past this point after Apple has granted the Family Controls Distribution entitlement.** A build before the grant will fail to install on TestFlight because the provisioning profile can't include the entitlement.

```
eas build --platform ios --profile production
```

First build takes ~15–25 minutes. EAS streams logs; you can also watch at `expo.dev`.

When the build completes, EAS prints the `.ipa` URL and (if your `eas.json` is wired) auto-bumps `buildNumber`.

## 4. Upload to TestFlight

```
eas submit --platform ios --latest
```

First time: prompts for the App Store Connect API key. Hand it:

- Key ID (from [apple-setup.md §4](./apple-setup.md#4-app-store-connect-api-key-for-eas-submit))
- Issuer ID
- Path to the `.p8` file

EAS stores it encrypted. Future submits are one-shot.

Processing in ASC takes 15–45 minutes. When it finishes:

- ASC emails you.
- Build appears under TestFlight → Builds.
- Answer the export-compliance prompt once (already pre-answered via `ITSAppUsesNonExemptEncryption=false`, so it auto-clears).

## 5. TestFlight Internal smoke test

1. ASC → TestFlight → Internal Testing → `+` → create group "Team" → add your Apple ID.
2. Attach the build to the group.
3. On your iPhone, open TestFlight, install Focus Blocks.
4. Walk the full [review-notes.md](./review-notes.md) HOW TO REVIEW flow end-to-end.
5. Kill the app; confirm scheduled shields still engage. Open on a second device; confirm iCloud sync.

If anything breaks, fix it locally, bump nothing (EAS auto-increments), and run §3 + §4 again.

## 6. Submit for Review

ASC → My Apps → Focus Blocks → Distribution → `1.0 Prepare for Submission`.

- **Build** section → pick the TestFlight-processed build from §4.
- All fields from [app-store-listing.md](./app-store-listing.md) must be green.
- **App Review Information → Notes** = contents of [review-notes.md](./review-notes.md).
- **Version Release** = Manually release after approval.
- Click **Add for Review** → **Submit to App Review**.

Typical review: 24–48 hours in 2026. Status progresses: Waiting for Review → In Review → Pending Developer Release → Ready for Sale.

## 7. Release

When status is **Pending Developer Release**: click **Release this Version**. Live on the App Store within ~2 hours (propagation across regions).

## 8. When you want to ship an update

```
# Bump version (CFBundleShortVersionString) for user-visible releases.
# Edit app.json -> expo.version and ios/FocusBlocks/Info.plist -> CFBundleShortVersionString.
eas build --platform ios --profile production    # buildNumber auto-increments
eas submit --platform ios --latest
```

Then in ASC: My Apps → `+ Version or Platform` → enter new version → attach build → Submit for Review.
