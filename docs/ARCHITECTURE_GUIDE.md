# Fucus Architecture

## 1. The Bridge Philosophy (thin native layer)

All blocking is enforced by Apple's Screen Time / DeviceActivity machinery.
Our Swift footprint is intentionally tiny: `react-native-device-activity`
ships a `DeviceActivityMonitor` extension that reads actions from
`UserDefaults` (shared via App Group) and applies `ManagedSettingsStore`
shields. We configure those actions from JavaScript via the package's
`startMonitoring` + `configureActions` API. Custom Swift code in the app
is limited to `ShieldAction` + `ShieldConfiguration` extensions wired in
`targets/`.

## 2. Data flow

Three JS stores are the single source of truth:

- `useBlocklistStore` (`src/features/blocker/useBlocklistStore.ts`) — one
  `BlockSelection` (apps + categories via Apple's picker tokens + web
  domains).
- `useScheduleStore` (`src/features/schedule/useScheduleStore.ts`) — the
  user's recurring windows.
- `useSettingsStore` (`src/features/settings/useSettingsStore.ts`) — the
  weekly admin (setup) window.

`useBlockerStore` tracks Screen Time authorization status (not persisted;
re-read on launch via `BlockerBridge.checkAuthorizationStatus`).

## 3. Persistence + sync

`src/shared/storage.ts` exposes a zustand `StateStorage` adapter that
reads from `AsyncStorage` (fast, local), falls back to iCloud Key-Value
Store on cold start when iCloud is available, and fans writes out to
both. `attachCloudSync(...)` at the root layout listens for remote iCloud
pushes and rehydrates all three stores. Apple's NSUbiquitousKeyValueStore
handles quota, offline queuing, and encryption.

Entitlement injection is handled by the `@nauverse/expo-cloud-settings`
Expo config plugin at prebuild time.

## 4. Scheduler

`src/features/schedule/scheduler.ts` is pure JS. Each enabled schedule is
expanded into N `DeviceActivity` monitors (one per weekday) via
`DateComponents.weekday`. For each monitor we persist
`configureActions('intervalDidStart', ...)` and
`configureActions('intervalDidEnd', ...)` to apply / remove the shield
using the current blocklist. `reconcileSchedules()` is idempotent and
runs in a `useEffect` in `(tabs)/_layout.tsx` whenever schedules or the
blocklist change.

## 5. No server, no auth

There is no backend. Apple `FamilyActivitySelection` tokens are
device-bound anyway — the only useful cross-device state is metadata and
schedules, both of which ride iCloud KV for free. Sign-in, user records,
and any concept of "online" are absent by design.
