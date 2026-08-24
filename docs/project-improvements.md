# Project Improvements

Only active, unimplemented work belongs in this document. Completed work should
be removed rather than retained as project history.

## Product Feedback

Review support messages and store reviews before each release. Group reports by
setup confusion, missed blocking, scheduling expectations, budgeting behavior,
and feature requests. Use repeated reports to choose the next product change.

## Diagnostics Export

Add an explicit, user-initiated support export if troubleshooting requires more
than the in-app diagnostics screen. Exclude selected app names and personal
content by default. Let the user review exactly what will be shared.

## Localization

Keep English and Russian complete across the app, stores, screenshots, privacy
copy, and support material. Add a language only when all of those surfaces can
be reviewed by a fluent speaker.

## Intentional Breaks

Expose scheduled breaks only after native DeviceActivity reconfiguration is
verified across app termination, device restart, daylight-saving changes, and
overlapping schedules. A JavaScript-only pause cannot reliably change callbacks
that iOS scheduled in advance.

## Android Release Readiness

Complete Play Console accessibility-tool review, data-safety declarations,
closed testing, and physical-device checks before production rollout. The
device matrix should cover current Android, one older supported API level,
battery-restricted operation, restart recovery, permission removal, and
accessibility-service interruption.

## Store Experiments

Create custom product pages or listing experiments only after acquisition data
is large enough to measure. Prioritize study, work, social-media limits, video
limits, and digital-detox intents, with screenshots and landing copy matched to
each intent.
