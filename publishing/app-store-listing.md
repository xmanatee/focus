# App Store Listing — exact copy for every ASC field

Paste these into App Store Connect → your app → Distribution → iOS App → `1.0 Prepare for Submission`.

## App Information

| Field | Value | Limit |
|---|---|---|
| Name | `Focus Blocks` | ≤ 30 |
| Subtitle | `Block distracting apps on a schedule` | ≤ 30 |
| Primary category | `Productivity` | — |
| Secondary category | `Lifestyle` | — |
| Content rights | Does not contain third-party content → **Yes** (confirm) | — |
| Age rating | **4+** (no objectionable content — answer "No" to every questionnaire item) | — |

## Pricing and Availability

- Price: **Free** (or whatever you choose)
- Availability: all territories — unless you have a reason to restrict
- App Distribution Methods: **Public on the App Store**

## Version Information (iOS 1.0)

### Promotional Text (≤ 170 chars — editable without re-review)

```
Pick the apps that pull you in. Pick when you want to focus. Focus Blocks hides them for exactly that long — then gives them back. No tracking. No account.
```

### Description (≤ 4000 chars)

```
Focus Blocks is the simplest way to put distracting apps out of reach during the time you set aside to focus.

Choose the apps. Choose the schedule. When your focus block begins, those apps are hidden system-wide until the block ends. No willpower games, no streaks, no social layer — just one clear setting that gives you your attention back.

Built on Apple's Screen Time APIs, Focus Blocks works entirely on your device. It has no backend and no account. Your app selections and your schedules sync between your own devices through iCloud, under your own Apple ID. Nothing else leaves your phone.

WHAT YOU CAN DO
• Create as many focus blocks as you want — mornings, weekdays, deep-work afternoons
• Pick specific apps and whole categories in one tap
• Set a start and end time, or mark a block as always-on
• Quickly unlock for a short break when you genuinely need it
• Enable or disable any block from one screen

PRIVACY BY DEFAULT
• No sign-up, no account
• No analytics, no ads, no third-party SDKs
• Uses Apple's Screen Time framework — selections and usage stay on-device
• iCloud Key-Value Store is the only remote storage, and it lives in your own Apple ID

Focus Blocks is self-directed. It is not a parental-control product and does not monitor or manage other people's devices.

Requires iOS 18 or later.
```

### Keywords (one field, 100 chars total, comma-separated, no spaces)

```
focus,blocker,schedule,productivity,screen time,distraction,digital wellness,deep work,block apps
```

(Exactly 100 chars. Do not duplicate words that are already in the Name or Subtitle — Apple indexes those automatically.)

### Support URL (required)

Host `publishing/privacy-policy.md` and a minimal support page (see [privacy-policy.md](./privacy-policy.md) header) together on GitHub Pages or any static host. Use:

```
https://<your-host>/focus-blocks/support
```

### Marketing URL (optional)

Skip for v1 unless you have a landing page.

### Privacy Policy URL (required)

```
https://<your-host>/focus-blocks/privacy
```

## Screenshots

**Required:** iPhone 6.9" display — **1320 × 2868 px** portrait. Minimum 1, maximum 10. Source: [Apple — Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/).

You do not need any other size — ASC auto-scales to 6.5" and smaller.

### Shot list (5 screenshots)

| # | What to show | Caption |
|---|---|---|
| 1 | Empty home — "no blocks yet" with big "Add block" button | `Start with one block` |
| 2 | Add-block flow showing the `FamilyActivityPicker` with apps selected | `Pick what pulls you in` |
| 3 | Schedule editor with a start/end time | `Pick when it stops` |
| 4 | Home screen showing an active block with shielded apps | `Focus is automatic` |
| 5 | Settings or unlock sheet showing iCloud sync mention | `Private by default` |

### How to capture

- iPhone 16 Pro Max in Simulator (Xcode → Window → Devices and Simulators → iPhone 16 Pro Max) → Device → Trigger Screenshot (`Cmd+S`).
- Or on a real iPhone 16 Pro Max / 15 Pro Max — press volume-up + side-button.
- Do not add device frames — ASC adds them automatically.

## App Privacy (Nutrition Label)

App Store Connect → your app → App Privacy → Edit.

Answer: **"We do not collect data from this app."**

Confirm: no analytics, no crash reporters (unless you add one — if you add Sentry or similar, come back and amend), no third-party SDKs that phone home. The Screen Time APIs read usage **on-device** — that does not count as collection under Apple's nutrition label rules.

iCloud Key-Value Store storage of user schedules does **not** count as data collection either, because it is stored in the user's own Apple ID container, not yours.

## Content and Review Information

### App Review Information

- Contact: your name, email, phone.
- Demo Account: not required (no login).
- Notes: paste the contents of [review-notes.md](./review-notes.md) verbatim.

### Version Release

- Automatically release this version → **After App Review**, manually. Gives you a last check before it goes live.

## Export Compliance

`ITSAppUsesNonExemptEncryption = false` is already set in `Info.plist`, so ASC will skip the questionnaire automatically. If it asks anyway: "No" → "No" → Save.

## Final submission checklist

Before hitting **Submit for Review**:

- [ ] Build is attached to this version (Build section — pick the TestFlight-processed build)
- [ ] Screenshots uploaded
- [ ] Description + keywords + promo text filled
- [ ] Support + privacy URLs resolve (test in incognito)
- [ ] App Privacy answered
- [ ] Age rating answered
- [ ] Review Notes filled from [review-notes.md](./review-notes.md)
- [ ] Family Controls entitlement **granted** — check that the latest build's provisioning profile includes `com.apple.developer.family-controls`
