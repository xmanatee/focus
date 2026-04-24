# App Review Information → Notes

Paste the block below verbatim into App Store Connect → your app → Distribution → `1.0 Prepare for Submission` → **App Review Information** → **Notes**.

Preempts the most common Screen Time / Family Controls rejections (Guideline 5.1.1, 5.1.2, 2.5.1, missing purpose strings).

---

> Focus Blocks is a personal focus app. It uses Apple's Screen Time frameworks (FamilyControls, DeviceActivity, ManagedSettings) under the Family Controls distribution entitlement that Apple has granted to our team (`569HBLNQPC`) for bundle ID `love.nemi.focus`.
>
> DATA MODEL
> - Fully on-device. No backend, no analytics, no account, no third-party SDKs.
> - Only remote storage: Apple's iCloud Key-Value Store (container `iCloud.love.nemi.focus`) — used to sync user-defined schedules between the user's own Apple devices under their own Apple ID.
> - Screen Time data (app selections, usage) stays on-device. It is never transmitted anywhere.
>
> HOW TO REVIEW
> 1. Launch the app. Approve the Screen Time authorization prompt (`NSFamilyControlsUsageDescription` — the rationale is shown on-screen).
> 2. Tap "Add block" → pick a few apps via the `FamilyActivityPicker` → set a start and end time → Save.
> 3. When the current time is inside the block's window, the selected apps are shielded system-wide via `ManagedSettingsStore`. Outside the window they behave normally.
> 4. Tapping a shielded app shows our custom shield (`ShieldConfiguration` extension) with an optional "unlock briefly" action (`ShieldAction` extension).
> 5. Schedule state is persisted locally and mirrored to iCloud KV for cross-device sync.
>
> EXTENSIONS BUNDLED
> - `love.nemi.focus.ActivityMonitorExtension` — DeviceActivityMonitor; flips shields on/off at schedule boundaries.
> - `love.nemi.focus.ShieldConfiguration` — custom shield UI shown when a user taps a blocked app.
> - `love.nemi.focus.ShieldAction` — handles the "unlock briefly" button on the shield.
>
> CONTACT
> [your email] — happy to walk through any flow or answer questions same-day.
