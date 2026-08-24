# Store Growth

## Sources Of Truth

`store.config.js` owns App Store metadata and screenshots. `play-store/` owns
Google Play copy, release notes, accessibility disclosure, and data-safety
working notes. Product claims must remain consistent with the app, privacy page,
support page, and platform permission disclosures.

## Search Intent

Prioritize a small set of concrete outcomes:

- Focus blocks and deep work
- App blocking and screen-time limits
- Study focus
- Video and social-media limits
- Digital detox

Do not repeat title or subtitle terms in App Store keyword fields. Prefer
specific user language over broad productivity terms. Change one meaningful
metadata theme at a time so ranking and conversion changes remain interpretable.

## Measurement

Review App Store and Play acquisition data by source, query, product-page
conversion, rating volume, and retention. Review Search Console and Bing
Webmaster data for the landing page and focused use-case pages. Record dated
discovery results in the automation report, not in this permanent guide.

Public search checks are directional. Store ranking varies by country, device,
account, and personalization, while web indexing can lag a successful live URL
test. Use platform dashboards as the authoritative source when available.

## Conversion

Screenshots should explain the core sequence: choose apps, create a schedule or
budget, verify blocking, and understand Lock-in. Prompt for a rating only after
several successfully completed scheduled windows, never during setup, recovery,
or an active block.

Run custom product pages and Play listing experiments only after there is enough
traffic to evaluate them. Match each experiment to one search intent and its
corresponding landing-page copy.

## Release Discipline

Validate metadata before submission and push App Store metadata before a version
enters review. Treat metadata upload failures as release failures rather than
submitting a binary with a partially updated listing. Keep release credentials
in CI and EAS, never in repository files.
