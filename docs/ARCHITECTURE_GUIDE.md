# Fucus Architecture: The Universal Proxy Pattern

## 1. The Bridge Philosophy (Generic Proxy)
To minimize native code (Swift), we implement a **Single-Channel Sync**. 

### Native Side (Swift)
The Swift code is "Stateless" and "Reactive." It only understands two things:
1. `PermissionManager`: Requests `FamilyControls` and returns a boolean.
2. `SyncModule`: Receives a `FucusConfig` JSON and writes it to the App Group (`UserDefaults`).

```swift
// Pseudo-code of the ENTIRE Bridge logic:
func syncState(json: String) {
    let config = decode(json)
    UserDefaults.group.set(config, forKey: "active_config")
    // Native extensions (Shield/Monitor) automatically pick this up
    ManagedSettingsStore().apply(config.blockedTokens) 
}
```

### React Native Side (JS)
1. **The Brain (`src/features/blocker/useBlockerStore.ts`)**: Calculates the `FucusConfig` based on the current time, user settings, and schedules.
2. **The Sync Engine**: Whenever the store changes, it calls the `syncState` bridge method.

## 2. Scalability
If we want to add a "Pomodoro Mode" or "Vacation Mode":
1. Update `useBlockerStore.ts` (100% JS).
2. It calculates which apps to block.
3. It sends the updated list to the same `syncState` method.
4. **NO SWIFT CHANGES REQUIRED.**

## 3. Native Extensions
The `ShieldExtension` and `DeviceActivityMonitor` are tiny (<30 lines) Swift files that act as "Listeners." They just read `active_config` from `UserDefaults` and tell the system what to do. This ensures high performance and low battery usage.
