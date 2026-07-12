# TrustForge mobile

Expo/React Native client for trust lookup, comparison, favorites, and trust-change alerts (roadmap issue #27). It consumes the shared `/api/v1` REST contracts — no mobile-only data shapes.

## Run

```bash
cd mobile
npm install
npm run ios      # or: npm run android, npm start
```

Point the app at a server in Settings (defaults to https://trustforge.au; MDM can pin it via managed configuration).

## Security model

- Session token and favorites only, in platform secure storage (Keychain / Keystore) via `expo-secure-store`; evidence bodies and audit material are never cached on device.
- Push payloads carry subject references and alert kind only; details load over the authenticated API on open.
- Deep links (`/registry/*`, `/search`) verify against `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` served by the web app; `webcredentials` binds platform passkeys to the domain.

## Accessibility

Every interactive element declares a role and label; scores are announced as text ("Trust score 82 out of 100"), never conveyed by colour alone; errors use `accessibilityRole="alert"`.

## Status

Core lookup, subject trust profile with open findings, favorites, alert inbox with acknowledgement, and push registration are implemented against the server backbone. Outstanding before store submission: authentication UI (passkey sign-in), APNs/FCM delivery worker on the server, compare screen, and the mobile security review.
