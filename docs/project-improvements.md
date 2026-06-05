# Project Improvements

These are the next high-leverage improvements for the Focus Blocks product and
launch effort.

## 1. Make New-Device Setup Self-Healing

Add an in-app check that detects when synced block rules exist but this device
has not selected local Screen Time apps yet. Show a direct setup flow instead of
letting the user believe old selections are already active on the new device.

## 2. Add A Shield Verification Screen

After authorization or rule changes, show a simple status screen that confirms
whether schedules, budgets, Lock-in, and extension communication are active.
This makes silent Screen Time failures much easier to catch.

## 3. Improve App Store Search Coverage

Keep `store.config.js` as the source of truth for metadata, then review search
terms monthly. Prioritize phrases like app blocker, screen time limit, block
YouTube, study focus, and digital detox.

## 4. Monitor Landing Page Search Discovery

Use Google Search Console and Bing Webmaster Tools to track search queries that
lead people to `focus.nemi.love`. Use those terms to tune the App Store subtitle,
keywords, and landing copy.

## 5. Add A Review Prompt At The Right Moment

Prompt for ratings only after a user has successfully completed several focus
blocks or budget days. Never prompt during setup, failure recovery, or when an
app is blocked.

## 6. Build Custom Product Pages

When there is enough traffic, create App Store custom product pages for study,
work, social media, YouTube limits, and digital detox. Match each page to its
own screenshots and landing-page section.

The landing side now has matching focused pages for YouTube blocking, iPhone
app blocking, screen time limits, study focus, and digital detox. Use those
pages as the copy source when creating custom product pages in App Store
Connect.

## 7. Add A Support Feedback Loop

Use support emails and App Store reviews to maintain a small issue log: setup
confusion, blocked-app misses, scheduling misunderstandings, and feature
requests. Review it before every release.

## 8. Expand Localizations Carefully

Keep English and Russian polished first. Add more languages only when the App
Store page, screenshots, support text, and core in-app copy can all be reviewed
properly.

## 9. Create A Privacy-Safe Diagnostics Path

Keep the no-analytics default, but add an explicit user-initiated diagnostics
export for support cases. It should include app state summaries, extension
status, and rule configuration without app names or personal content unless the
user deliberately includes them.

## 10. Strengthen The nemi.love Brand Surface

Use `focus.nemi.love`, support email, privacy pages, App Store copy, and release
notes consistently. If the brand grows, convert the Apple Developer account to
an organization so the seller name can align with the brand instead of the
individual account name.

## 11. Design Breaks Only With Native Reconfiguration

Intentional breaks are strategically useful, but should not ship as a purely
JavaScript pause. DeviceActivity callbacks are configured ahead of time, so a
break needs a native-side reconfiguration path or equivalent Screen Time action
strategy before the app exposes it. A half-working break would make blocking
feel unreliable.
