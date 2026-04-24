# Focus Blocks — Design Doc

## Vision

Focus Blocks is a productivity iOS app that blocks distracting apps and
websites. It leverages Apple's Screen Time / Family Controls API for
native-level blocking without VPNs or MDM.

Entirely local: no server, no accounts, no sign-in. State syncs across
the user's iCloud-signed devices via Apple's NSUbiquitousKeyValueStore.

## Competitive landscape

| App | Tech | Pros | Cons |
| :--- | :--- | :--- | :--- |
| Opal | Native Swift | High polish, deep Screen Time integration. | Subscription heavy, closed source. |
| Freedom | VPN / Profile | Cross-platform. | VPN instability, privacy concerns. |
| One Sec | Native Swift | Excellent interception UX. | Very narrow scope. |

## Non-obvious constraints

1. **Entitlements.** `ManagedSettings` access requires the
   `com.apple.developer.family-controls` distribution entitlement, which
   Apple grants per bundle ID with a ~1–4 week review.
2. **Extensions.** System-level blocking runs in Swift extension
   processes (`DeviceActivityMonitor`, `ShieldAction`, `ShieldConfiguration`);
   JS never runs there. Shared state goes through the App Group's
   `UserDefaults`.
3. **Website blocking** is capped at 50 domains per Apple's web-content
   filter policy.
4. **Cross-device sync.** `FamilyActivitySelection` tokens are
   device-bound. iCloud KV carries metadata only (counts, domains,
   focus blocks, setup block).
5. **Privacy budget.** No app-usage telemetry ever leaves the device.
