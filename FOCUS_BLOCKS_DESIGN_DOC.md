# Focus Blocks Architecture

## Vision

Focus Blocks shares its React Native interface, rule model, validation, and
device-local activation policy across iOS and Android. Native adapters own
permission requests and background enforcement; the interface uses capabilities
rather than operating-system checks.

There is no backend or sign-in. iCloud synchronizes rule definitions and setup
windows on Apple devices. App selections, enabled blocks, and Lock-in activation
stay local. A new installation starts with blocking and Lock-in off.

## Enforcement

- iOS uses Family Controls, Managed Settings, and Device Activity extensions.
  Extensions run independently of JavaScript and share state through the App
  Group. Distribution requires Apple's Family Controls entitlement.
- Android uses Accessibility for app interception, Usage Access for selected-app
  budgets, and a local DNS VPN for websites. Enforcement runs natively, without
  a JavaScript timer. Android permits only one active VPN, and applications
  that bypass system DNS can bypass DNS filtering.

## Invariants

- Permission requests and permission-change subscriptions publish the same
  complete access snapshot. A block runs only when its local selection and
  required runtime permissions are ready.
- Disabled or unready blocks remain editable. Strict mode protects active
  blocks; Lock-in protects enabled, runnable blocks outside the setup window.
  Android cannot prevent system settings from revoking access or uninstalling.
- Schedule membership uses one shared calculation, including overnight windows
  and week rollover. Overlapping blocks combine restrictions, not allowances.
- Persisted data is validated at the storage boundary. Platform adapters use
  their native APIs directly; shared bridge methods must work on both platforms.
- Selected-app usage stays on-device. The Android DNS VPN sends allowed DNS
  queries to the network resolver, not to a Focus Blocks server.
