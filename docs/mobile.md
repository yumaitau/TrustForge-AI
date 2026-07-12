# Mobile trust lookup and alerts

Phase 9 delivers native iOS and Android access to trust lookup, comparison, favorites, and trust-change alerts. This document covers the server backbone (shipped) and the app architecture it supports.

## Server backbone

- **Device registry** (`mobile_devices`): per-user push tokens with platform, app version, and a push-enabled flag. Registration is idempotent per (user, token).
- **Push preferences** (`alert_preferences`): per-subject opt-ins for score drops, new findings (with a minimum severity), and verification changes. Upserts are idempotent, so preference sync is safe to retry.
- **Alert outbox** (`trust_alerts`): `enqueueTrustAlerts` fans a trust-change event out to every matching preference (deterministic routing in `lib/mobile/alerts.ts` — score alerts fire only on drops, finding alerts respect minimum severity, verification alerts are opt-in). Delivery workers read queued alerts; clients acknowledge via the API.
- **Favorites** (`mobile_favorites`): minimal server-side sync — subject references and an optional label only, never evidence bodies.

## API contracts (shared with web)

- `POST /api/v1/mobile/devices`, `DELETE /api/v1/mobile/devices/:id`
- `GET|PUT /api/v1/mobile/preferences`
- `GET|POST /api/v1/mobile/favorites`, `DELETE /api/v1/mobile/favorites/:id`
- `GET /api/v1/mobile/alerts`, `POST /api/v1/mobile/alerts` (acknowledge)
- Lookup, comparison, recommendations, and security findings reuse the existing `/api/v1/*` contracts — no mobile-only data shapes.

## Deep links

`/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` are served dynamically with team/package identifiers from deploy configuration. Supported link paths: `/registry/*`, `/search`.

## Security model

- **Authentication**: platform passkeys via the existing better-auth deployment (`webcredentials` / `get_login_creds` are declared in the well-known files so passkey autofill binds to this domain).
- **Minimal local sensitive data**: apps cache favorites and the most recent trust summaries only, in platform secure storage (Keychain / Android Keystore-backed encrypted storage); evidence bodies and audit material are never persisted on device.
- **Managed devices**: app configuration is exposed via AppConfig/managed configuration keys (server URL, allowed organisation) so MDM can pin deployments.
- **Push payloads carry no sensitive content**: notifications contain subject references and alert kind only; details are fetched over the authenticated API on open.

## Accessibility

Core lookup screens must meet platform accessibility requirements (VoiceOver/TalkBack labels, dynamic type, minimum contrast). This is an acceptance criterion for the app release, verified in the mobile security and accessibility review before store submission.

## Status and next steps

The server backbone, deep-link configuration, alert routing, and API contracts are shipped and tested. The app clients (React Native/Expo sharing the REST contracts, or Swift/Kotlin native) are the remaining deliverable, tracked in issue #27, followed by the mobile security review. Future: barcode/package scanning, field evidence capture, wallet credentials, mobile admin approvals.
