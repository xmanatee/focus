# Auth setup — the parts Claude cannot do for you

`BETTER_AUTH_SECRET` is already set on the dev Convex deployment.
`scripts/generate-apple-client-secret.mjs` is ready to turn a `.p8` into the
6-month JWT Better Auth wants as `APPLE_CLIENT_SECRET`.

Everything else below requires you to sign in to portals that are outside the
agent's reach (Apple 2FA, Google account). Steps are ordered so that each one
unlocks the next. Paste the outputs back when asked.

## A. Apple — Sign In with Apple

### A1. App ID capability

1. Go to <https://developer.apple.com/account/resources/identifiers/list>.
2. Click your existing App ID for `com.yourbound.fucus`.
3. Tick **Sign In with Apple** under Capabilities. Save.

### A2. Services ID (the OAuth `clientId`)

1. Same Identifiers page → `+` → **Services IDs** → Continue.
2. Description: `Fucus Sign In`. Identifier: `com.yourbound.fucus.si`. Register.
3. Reopen the new Services ID → tick **Sign In with Apple** → Configure.
4. **Primary App ID**: `com.yourbound.fucus`.
5. **Domains and Subdomains**: `expert-walrus-588.eu-west-1.convex.site`.
6. **Return URLs**: `https://expert-walrus-588.eu-west-1.convex.site/api/auth/callback/apple`.
7. Save.

### A3. Sign In with Apple key

1. <https://developer.apple.com/account/resources/authkeys/list>.
2. `+` → Key Name: `Fucus Sign In with Apple`.
3. Tick **Sign In with Apple** → Configure → pick `com.yourbound.fucus` as the
   primary App ID. Save. Continue. Register.
4. **Download the `.p8` file** — Apple only lets you download it once. Save it
   outside the repo (e.g. `~/Downloads/AuthKey_XXXXXXXXXX.p8`).
5. Note the **Key ID** shown next to the file name.

### A4. Generate the client-secret JWT and set Convex env vars

With the `.p8` path, Key ID, and your Team ID `569HBLNQPC`:

```bash
cd apps/fucus
node scripts/generate-apple-client-secret.mjs \
  --key=~/Downloads/AuthKey_XXXXXXXXXX.p8 \
  --team=569HBLNQPC \
  --key-id=XXXXXXXXXX \
  --services-id=com.yourbound.fucus.si > /tmp/apple-client-secret.jwt

npx convex env set APPLE_CLIENT_ID      com.yourbound.fucus.si
npx convex env set APPLE_CLIENT_SECRET  "$(cat /tmp/apple-client-secret.jwt)"
rm /tmp/apple-client-secret.jwt
```

Apple-generated JWT is valid for 180 days. Re-run the script before it
expires and re-set the env var.

## B. Google — native iOS sign-in

### B1. OAuth consent screen

1. <https://console.cloud.google.com/apis/credentials/consent>.
2. Pick the project. If none exists, create one.
3. User type: **External**. Fill in App name, support email.
4. Scopes: add `openid`, `email`, `profile`. Save.
5. Test users: add your Gmail while in Testing mode (or publish).

### B2. OAuth client — iOS (native)

1. <https://console.cloud.google.com/apis/credentials> → `+ CREATE CREDENTIALS`
   → **OAuth client ID**.
2. Application type: **iOS**.
3. Name: `Fucus iOS`.
4. Bundle ID: `com.yourbound.fucus`.
5. Create. Record the **Client ID** (looks like
   `123456789-abcdef123456.apps.googleusercontent.com`).

### B3. OAuth client — Web (server-side audience)

1. Same credentials page → another OAuth client ID.
2. Application type: **Web application**.
3. Name: `Fucus Web Backend`.
4. Authorized redirect URIs: add
   `https://expert-walrus-588.eu-west-1.convex.site/api/auth/callback/google`.
5. Create. Record the **Client ID** and **Client Secret**.

### B4. Set env vars

Replace the three placeholders and run:

```bash
cd apps/fucus
npx convex env set GOOGLE_IOS_CLIENT_ID      <ios-client-id>
npx convex env set GOOGLE_WEB_CLIENT_ID      <web-client-id>
npx convex env set GOOGLE_WEB_CLIENT_SECRET  <web-client-secret>
```

And add to `.env.local`:

```
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios-client-id>
```

### B5. Reverse the iOS client ID for the URL scheme

Take `123456789-abcdef123456.apps.googleusercontent.com` and reverse the
domain to get
`com.googleusercontent.apps.123456789-abcdef123456`. Replace the
`PLACEHOLDER_REVERSED_IOS_CLIENT_ID` in `app.json`'s
`@react-native-google-signin/google-signin` plugin config with that value.

## C. First build

```bash
cd apps/fucus
npx expo prebuild --clean
npm run ios -- --device MikePhone --configuration Release
```

The `prebuild --clean` is required: `usesAppleSignIn: true` only enrolls the
Sign In with Apple entitlement into `ios/fucus/fucus.entitlements` on
prebuild, and the Google URL type only lands in `Info.plist` the same way.

## D. Confirm

1. Open the app → Continue with Apple → Face ID prompt (not Safari).
2. Close, reopen → session persists (Better Auth + SecureStore).
3. Sign out from Settings → Continue with Google → native Google sheet.
4. Confirm in Convex dashboard that a record exists in the `betterAuth.user`
   component table.

## E. What to hand back for the agent to finish

If you'd rather the agent finishes wiring, paste this back verbatim and it
will run B4, B5, and any other follow-through:

```
APPLE_SERVICES_ID=com.yourbound.fucus.si
APPLE_KEY_ID=<from A3 step 5>
APPLE_P8_PATH=<absolute path to the downloaded AuthKey file>
GOOGLE_IOS_CLIENT_ID=<from B2>
GOOGLE_WEB_CLIENT_ID=<from B3>
GOOGLE_WEB_CLIENT_SECRET=<from B3>
```
