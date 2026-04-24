# Fucus — Design Doc

## 1. Executive Summary
Fucus is a productivity iOS app that blocks distracting apps and websites.
It leverages Apple's **Screen Time / Family Controls** API (iOS 15+) for 
native-level blocking without VPNs or MDM.

The app is entirely local; no server, no accounts, no sign-in. Focus blocks,
blocklist metadata, and the weekly setup block live in three persisted
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
   `com.apple.developer.family-controls` entitlement.
2. **Extensions**: System-level blocking runs in Swift extension
   processes (`DeviceActivityMonitor`, `ShieldAction`, `ShieldConfiguration`);
   JS never runs there.
3. **Website blocking** is capped at 50 domains per Apple's web-content
   filter.
4. **Cross-device sync**: Apple tokens from `FamilyActivitySelection` are
   device-bound. iCloud KV carries the metadata (counts, domains,
   focus blocks, setup blocks).

---

## 4. Architecture

See [`docs/ARCHITECTURE_GUIDE.md`](docs/ARCHITECTURE_GUIDE.md) for the
runtime picture (stores, sync engine, bridge, iCloud sync).

```text
app/                       # Expo Router routes
├── _layout.tsx            # Root Stack + theme + iCloud sync listener
├── index.tsx              # Main Feed (Permissions, Active Session, Lock-in, Focus Blocks)
├── add-focus-block.tsx    # Create / edit Focus Block + site blocking (modal)
└── settings.tsx           # Setup block (modal)

src/
├── bridge/BlockerBridge.ts       # Screen Time authorization wrapper
├── features/
│   ├── blocker/
│   │   ├── constants.ts
│   │   ├── domain.ts             # parseBlockedDomain (WHATWG URL parser)
│   │   ├── types.ts              # BlockSelection types
│   │   ├── useBlockerStore.ts    # auth status (persisted)
│   │   └── useBlocklistStore.ts  # temp buffer during creation
│   ├── schedule/
│   │   ├── activeness.ts         # isFocusBlockActiveAt / nextStartAfter
│   │   ├── scheduler.ts          # reconcileFocusBlocks → DeviceActivity
│   │   ├── types.ts
│   │   ├── useActiveBlock.ts
│   │   ├── useFocusBlockStore.ts # CRUD (persisted)
│   │   └── validation.ts
│   └── settings/
│       ├── adminState.ts         # resolveAdminState (pure)
│       ├── useAdminState.ts
│       ├── useSettingsStore.ts   # setup block (persisted)
│       └── validation.ts
└── shared/
    ├── components/               # Screen, Button, Typography, Icon
    ├── design/                   # theme, haptics, motion
    ├── hooks/                    # useAsyncAction
    └── storage.ts                # AsyncStorage + iCloud KV adapter
```

---

## 5. Product Features

### 5.1 Blocklist
- Each focus block carries its own `BlockSelection`.
- Apps + Categories: system `FamilyActivityPicker` counts only.
- Websites: manual domain entry per block.
- The `useBlocklistStore` acts as a temporary buffer during block creation and editing.

### 5.2 Focus Blocks (primary driver)
- Recurring day-of-week + start/end time blocks.
- Sync engine materializes each focus block into one `DeviceActivity` per
  active weekday; `intervalDidStart` / `intervalDidEnd` actions apply
  and clear the shield without the JS app being alive.
- **Active-block lock**: while a focus block is active, its
  toggle/edit/delete are disabled.

### 5.3 Setup Block (anti-bypass)
- User-configured recurring block in Settings. When set, every
  destructive change (add/edit/delete focus block, edit the
  setup block itself) requires being inside an active setup block.

---

## 6. Constraints
- **Privacy**: no app-usage telemetry.
- **Stability**: Zustand selectors + the `scripts/check-antipatterns.mjs`
  guardrails.
- **Maintenance**: 300-line file limit, Biome for lint/format.
