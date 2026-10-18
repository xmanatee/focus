# Google Play Data Safety Source

Use this file as the source of truth when completing the Play Console form.

## Collection and sharing

- Data collected by the developer: none.
- Data shared with third parties: none.
- Required account: none.
- Advertising: none.
- Analytics: none.

## On-device processing

The app stores rules, selected package identifiers, and application labels in
private local storage. Its Accessibility service processes foreground
application identifiers transiently on the device. These values are not sent
off the device, so they are not declared as collected under the Google Play Data
safety definition.

With Usage Access, the app reads Android usage events to calculate time spent in
the apps selected for a budget. It does not retain or upload usage event history.
It stores a local marker to avoid repeating a budget warning in the same window.

With VPN consent, the app routes DNS queries through a local VPN interface and
compares domain names with active website rules. Blocked queries receive a local
negative response; allowed queries go to the current network's DNS resolver.
There is no remote VPN server, traffic proxy, browsing log, or developer upload.

## Security and deletion

- Data is protected by the Android application sandbox.
- Users can disable Accessibility access in Android Settings.
- Users can revoke Usage Access and disconnect the local VPN in Android Settings.
- Uninstalling Focus Blocks removes its local app data.
- No remote deletion mechanism is needed because there is no account or backend.

Revalidate this declaration before every release and whenever a dependency,
permission, storage mechanism, or network behavior changes.
