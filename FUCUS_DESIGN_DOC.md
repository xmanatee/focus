# Fucus — Design Doc

## 1. Executive Summary
Fucus is a productivity iOS app that blocks distracting apps and websites
on a weekly schedule. It leverages Apple's **Screen Time / Family
Controls** API (iOS 15+) for native-level blocking without VPNs or MDM.

The app is entirely local; no server, no accounts, no sign-in. Schedules,
blocklist metadata, and the weekly setup window live in three persisted
Zustand stores and sync across the user's iCloud-signed devices via
Apple's NSUbiquitousKeyValueStore.

---

## 2. Competitive Landscape
| App | Tech | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Opal** | Native Swift | High polish, deep Screen Time integration. | Subscription heavy, closed source. |
| **Freedom** | VPN / Profile | Cross-platform. | VPN instability, privacy concerns. |
| **One Sec** | Native Swift | Excellent interception UX. | Very narrow scope. |

## 3. Core Technical Hurdles
1. **Entitlements**: `ManagedSettings` access requires the
   `com.apple.developer.family-controls` entitlement, requested manually
   from Apple. Already granted for team 569HBLNQPC.
2. **Extensions**: System-level blocking runs in Swift extension
   processes (`DeviceActivityMonitor`, `ShieldAction`, `ShieldConfiguration`);
   JS never runs there. We use `react-native-device-activity` which
   bundles the monitor extension and reads configured actions from the
   shared App Group at runtime.
3. **Website blocking** is capped at 50 domains per Apple's web-content
   filter.
4. **Cross-device sync**: Apple tokens from `FamilyActivitySelection` are
   device-bound. iCloud KV carries the metadata (counts, domains,
   schedules, setup hours); app pickers must be re-applied once per
   device.

---

## 4. Architecture

See [`docs/ARCHITECTURE_GUIDE.md`](docs/ARCHITECTURE_GUIDE.md) for the
runtime picture (stores, scheduler, bridge, iCloud sync).

```text
app/                       # Expo Router routes
├── _layout.tsx            # Root Stack + theme + iCloud sync listener
├── index.tsx              # Main Feed (Permissions, Active Session, Lock-in, Schedules)
├── add-schedule.tsx       # Create / edit schedule + site blocking (modal)
├── select-apps.tsx        # Apple FamilyActivityPicker wrapper
└── settings.tsx           # Setup hours (modal)

src/
├── bridge/BlockerBridge.ts       # Screen Time authorization wrapper
├── features/
│   ├── blocker/
│   │   ├── constants.ts
│   │   ├── domain.ts             # parseBlockedDomain (WHATWG URL parser)
│   │   ├── types.ts              # BlockSelection types
│   │   ├── useBlockerStore.ts    # auth status (not persisted)
│   │   └── useBlocklistStore.ts  # apps + sites (persisted)
│   ├── schedule/
│   │   ├── activeness.ts         # isScheduleActiveAt / nextStartAfter
│   │   ├── scheduler.ts          # reconcileSchedules → DeviceActivity
│   │   ├── types.ts
│   │   ├── useActiveSchedule.ts
│   │   ├── useScheduleStore.ts   # CRUD (persisted)
│   │   └── validation.ts
│   └── settings/
│       ├── adminState.ts         # resolveAdminState (pure)
│       ├── useAdminState.ts
│       ├── useSettingsStore.ts   # setup window (persisted)
│       └── validation.ts
└── shared/
    ├── components/               # Screen, Button, Typography, Icon
    ├── design/                   # theme, haptics, motion
    ├── hooks/                    # useAsyncAction
    └── storage.ts                # AsyncStorage + iCloud KV adapter

targets/                          # Swift extensions (ShieldAction, ShieldConfiguration)
```

---

## 5. Product Features

### 5.1 Blocklist
- Each schedule carries its own `BlockSelection`.
- Apps + Categories: system `FamilyActivityPicker` counts only.
- Websites: manual domain entry per schedule.
- The `useBlocklistStore` acts as a temporary buffer during schedule creation and editing.

### 5.2 Schedules (primary driver)
- Recurring day-of-week + start/end time windows.
- Scheduler materializes each schedule into one `DeviceActivity` per
  active weekday; `intervalDidStart` / `intervalDidEnd` actions apply
  and clear the shield without the JS app being alive.
- Active-window lock: while a schedule's window is active, its
  toggle/edit/delete are disabled, and the blocklist editor is read-only.

### 5.3 Setup hours (anti-bypass)
- User-configured recurring window in Settings. When set, every
  destructive change (add/edit/delete schedule, edit blocklist, edit the
  setup window itself) requires being inside an active setup window.
- Full OS-level lock (prevent app deletion, block clock manipulation) is
  MDM-only on consumer iOS and explicitly not pursued.

---

## 6. Constraints
- **Privacy**: no app-usage telemetry; nothing leaves the device except
  iCloud KV syncing user-chosen settings.
- **Stability**: Zustand selectors + the `scripts/check-antipatterns.mjs`
  guardrails. Never `useRootNavigationState` as a render gate.
- **Maintenance**: 300-line file limit, Biome for lint/format, `vitest`
  for pure-logic unit tests.
