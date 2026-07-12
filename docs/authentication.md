# Authentication and identity

TrustForge uses Better Auth through the App Router catch-all at `/api/auth/[...all]`.

## Supported foundation methods

- Email and password with a 14-character minimum
- WebAuthn passkeys
- TOTP with one-time recovery codes and trusted devices
- Conditional OAuth configuration for GitHub, Google, Microsoft, Apple, GitLab, and LinkedIn

Provider credentials are read from the variables documented in `.env.example`. Providers with incomplete credentials are not registered.

## Enterprise boundary

SAML, enterprise OIDC, and SCIM are delivery work behind the identity-provider interface. They must map external groups to TrustForge roles without making the external identity provider authoritative for application authorization.

## Enforcement

Proxy performs an optimistic session-cookie check. It is not an authorization boundary. Server layouts, actions, and route handlers validate the session, database membership, active organisation, and explicit permission.

Organisation MFA policy supports `optional`, `admin_required`, and `all_users_required`. Privileged product routes redirect unenrolled users to `/mfa` when policy requires it.
