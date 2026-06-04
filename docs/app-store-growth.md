# App Store Growth

## Current ASO Config

`store.config.js` is the source of truth for App Store metadata. `eas.json`
points the production iOS submit profile at that file with `metadataPath`, so
metadata changes should be reviewed in Git and pushed with EAS Metadata.

Current target metadata:

- Version: `1.0.1`
- Title: `Focus Blocks: App Blocker`
- Subtitle: `Reduce screen time`
- Keywords: `distractions,digital wellness,deep work,concentration,study,detox,self control,phone,habits`

Run metadata validation before pushing:

```sh
npm exec --yes --package eas-cli -- eas metadata:lint
```

Push metadata after review:

```sh
npm exec --yes --package eas-cli -- eas metadata:push
```

The review contact fields in `store.config.js` require the
`APPLE_REVIEW_FIRST_NAME`, `APPLE_REVIEW_LAST_NAME`, `APPLE_REVIEW_EMAIL`, and
`APPLE_REVIEW_PHONE` environment variables.

## Why These Fields

Apple says search relevance uses the app name, subtitle, keywords, and primary
category, while ranking is also affected by downloads, ratings, and user
behavior. Promotional text does not improve search ranking.

The title keeps the brand and adds the exact phrase `App Blocker`. The subtitle
adds `screen time` without repeating title/category terms. The keyword list
avoids duplicate words from the title, subtitle, and Productivity category.

References:

- https://developer.apple.com/app-store/search/
- https://developer.apple.com/app-store/product-page/
- https://docs.expo.dev/eas/metadata/config/
- https://docs.expo.dev/eas/metadata/schema/

## Next Iterations

- Add `en-US` and `ru` localizations instead of relying only on `en-GB`.
- Create custom product pages for `screen time`, `deep work`, `study focus`,
  and `digital detox` angles.
- Rework the first three screenshots around concrete outcomes: pick apps,
  set a rule, apps are shielded.
- Ask for ratings only after a user has successfully completed several focus
  sessions; do not prompt on first launch.
- Review App Analytics weekly by source type, search terms, product page
  conversion, and retention.
