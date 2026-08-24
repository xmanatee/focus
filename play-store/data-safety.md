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

## Security and deletion

- Data is protected by the Android application sandbox.
- Users can disable Accessibility access in Android Settings.
- Uninstalling Focus Blocks removes its local app data.
- No remote deletion mechanism is needed because there is no account or backend.

Revalidate this declaration before every release and whenever a dependency,
permission, storage mechanism, or network behavior changes.
