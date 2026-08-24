# Google Play Accessibility Declaration

## Core functionality

Focus Blocks uses `AccessibilityService` for deterministic, user-configured app
blocking. It receives foreground window-change events, compares the foreground
package identifier with locally stored enabled schedules, sends the user to the
Home screen, and opens the Focus Blocks blocked screen when a selected package
is blocked.

The service is not an accessibility tool for people with disabilities, so
`isAccessibilityTool` is `false`.

## Data access and use

- Accessed: foreground application package identifier from window-change events.
- Used for: local comparison with app identifiers and schedules selected by the
  user.
- Stored: selected application identifiers, labels, and rules in private local
  app storage. Foreground events are not logged or retained.
- Shared or transmitted: none.
- Not available to the service: window content, view hierarchy, screen text,
  keystrokes, screenshots, gestures, or Accessibility button control.

## Disclosure and consent flow

Before Android Accessibility Settings opens, Focus Blocks displays a separate
in-app disclosure that explains the accessed data, exact blocking use,
non-collection and non-sharing behavior, and that blocking works only while
access remains enabled. The user must choose `Open Settings`; `Not now` and
dismissal do not open Settings or enable anything.

## Review video

Record one continuous video that shows:

1. Opening Focus Blocks and triggering blocking-access setup.
2. Reading the complete in-app disclosure.
3. Choosing `Not now`, then opening the disclosure again.
4. Choosing `Open Settings` and enabling `Focus Blocks app blocking`.
5. Creating and explicitly enabling a scheduled block with a selected app.
6. Opening that app during the schedule and seeing the Focus Blocks blocked
   screen.
7. Returning to Android Accessibility Settings and disabling the service.
