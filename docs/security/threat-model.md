# Foundation threat model

## Assets

- Organisation identity, membership, policy, and credentials
- Vendor claims and verification challenges
- Evidence artifacts, provenance, and adjudication history
- Trust scores and methodology versions
- Audit history and administrative actions

## Primary threats

- Tenant boundary bypass or insecure direct object references
- Forged vendor ownership and evidence provenance
- Review manipulation, sock puppets, and coordinated voting
- Malicious uploads, dependency metadata, or scanner output
- Score tampering or untraceable methodology changes
- Credential theft, session replay, and MFA bypass
- SSRF through repository, URL, webhook, or MCP inspection
- Supply-chain compromise of workers or scanning infrastructure

## Foundation controls

- Server-side authorization is authoritative; routing gates are only a fast path.
- Tenant context must be revalidated against database membership per request.
- Evidence and scores are separate, append-oriented records with explicit provenance.
- Score explanations retain their evidence identifiers and methodology version.
- Security headers, strict TypeScript, parameterized ORM queries, and short sessions are baseline controls.
- Uploads and outbound scanners remain disabled until isolated scanning and allow-list controls are implemented.

## Required follow-up

Formal data-flow diagrams, abuse cases, STRIDE assessment, security test automation, cryptographic audit chaining, secrets management, and incident response are tracked in the GitHub roadmap.
