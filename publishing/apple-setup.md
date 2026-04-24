# Apple Setup — one-time portal + ASC configuration

Everything you do in Apple's web consoles before the first build. Run these sections in order — `2 → 1 → 3 → 4`.

**Precondition:** renames from [rename-checklist.md](./rename-checklist.md) are done.

## 1. Apple Developer Portal — Identifiers

https://developer.apple.com/account/resources/identifiers/list

### 1.1 App IDs

Create **four** App IDs, one per target. For each: Identifiers → `+` → App IDs → App → Continue → "Explicit" → Bundle ID below → Capabilities as listed → Continue → Register.

| # | Bundle ID | Description | Capabilities |
|---|---|---|---|
| 1 | `love.nemi.focus` | Focus Blocks | iCloud (include CloudKit), App Groups, Family Controls |
| 2 | `love.nemi.focus.ActivityMonitorExtension` | Focus Blocks — Activity Monitor | App Groups |
| 3 | `love.nemi.focus.ShieldAction` | Focus Blocks — Shield Action | App Groups |
| 4 | `love.nemi.focus.ShieldConfiguration` | Focus Blocks — Shield Configuration | App Groups |

### 1.2 App Group

Identifiers → `+` → App Groups → Continue.

- Description: `Focus Blocks App Group`
- Identifier: `group.love.nemi.focus`

Then attach it to all four App IDs: for each App ID → Edit → App Groups → Configure → check `group.love.nemi.focus` → Save.

### 1.3 iCloud Container

Identifiers → `+` → iCloud Containers → Continue.

- Description: `Focus Blocks iCloud`
- Identifier: `iCloud.love.nemi.focus`

Attach to the main App ID `love.nemi.focus`: Edit → iCloud → Configure → check the container → Save.

### 1.4 Leave Certificates / Profiles alone

EAS regenerates both on the first build. If you later want to clean up: Profiles → filter by the old bundle ID → Revoke.

## 2. App Store Connect — create the app record

https://appstoreconnect.apple.com/apps

My Apps → `+` → New App.

| Field | Value |
|---|---|
| Platform | iOS |
| Name | `Focus Blocks` |
| Primary Language | English (U.S.) |
| Bundle ID | `love.nemi.focus` (dropdown — must appear after §1.1) |
| SKU | `focus-blocks-ios-2026` |
| User Access | Full Access |

Save. The record is now live but unsubmitted — fine.

## 3. Family Controls Distribution Request

https://developer.apple.com/contact/request/family-controls-distribution/

**This is the long pole. Submit it the same day you finish §1.1.** Typical turnaround: 1–4 weeks, no SLA.

Exact form content — paste as-is, edit the italics only:

> **App name:** Focus Blocks
> **Bundle ID:** `love.nemi.focus`
> **Team ID:** `569HBLNQPC`
>
> **Description:**
> Focus Blocks is a personal focus and digital-wellness app that helps users voluntarily restrict their own access to distracting apps during schedules they define. It uses `FamilyControls`, `DeviceActivity`, and `ManagedSettings` to: (1) request `AuthorizationCenter` approval from the user, (2) let the user pick apps/categories via `FamilyActivityPicker`, (3) apply `ManagedSettingsStore` shields during user-defined schedules, and (4) remove shields when the schedule ends via `DeviceActivityMonitor`.
>
> All data is on-device only. The app has no backend server. The only remote component is Apple's iCloud Key-Value Store (container `iCloud.love.nemi.focus`), which syncs user-defined schedules between the user's own Apple devices under their own Apple ID.
>
> Focus Blocks is not a parental-control product and does not manage other users' devices. It is single-user, self-directed focus tooling. Shields, selections, and usage never leave the device.
>
> **Extensions (separate Bundle IDs under the same Team):**
> - `love.nemi.focus.ActivityMonitorExtension` — `DeviceActivityMonitor`, reacts to schedule start/end.
> - `love.nemi.focus.ShieldConfiguration` — custom shield UI.
> - `love.nemi.focus.ShieldAction` — "unlock for a short period" action.
>
> **Platform:** iOS 18.0+

**Known rejection triggers, avoided here:** vague purpose, "analytics" framing, enterprise-MDM framing, bundle-ID mismatch, missing team context.

When Apple replies (email to the team's primary contact), they enable the entitlement against the specific App ID. No code change needed on your side — the next EAS build's provisioning profile picks it up automatically.

## 4. App Store Connect API Key (for `eas submit`)

https://appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API → Generate API Key.

| Field | Value |
|---|---|
| Name | `EAS Submit` |
| Access | Admin |

Download the `.p8` file immediately — Apple only shows it once. Record:

- **Issuer ID** (shown at top of the page)
- **Key ID** (next to the key in the list)
- `.p8` file path (store somewhere safe; do **not** commit)

You'll hand these to `eas submit` the first time it runs; EAS then stores them.

## 5. Verification

Before moving to [build-and-submit.md](./build-and-submit.md):

- [ ] Four App IDs exist with correct capabilities
- [ ] App Group is attached to all four App IDs
- [ ] iCloud Container is attached to main App ID
- [ ] ASC app record `Focus Blocks` (`love.nemi.focus`) exists in My Apps
- [ ] Family Controls request submitted — email confirmation received
- [ ] `.p8` API key downloaded, Issuer ID + Key ID saved somewhere safe
