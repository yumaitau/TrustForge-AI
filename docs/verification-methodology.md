# Verification methodology

Verification communicates the assurance performed, not a general endorsement.

## Levels

1. **Unverified**: no accepted ownership or assurance evidence.
2. **Community Verified**: material public facts have been corroborated by reputable community contributors.
3. **Identity Verified**: one or more responsible individuals have proven control of a verified identity channel.
4. **Organisation Verified**: the legal organisation has proven control through DNS, corporate email, GitHub/OAuth provider attestation, or a signed challenge.
5. **Security Verified**: current security controls and vulnerability practices meet the published security verification profile.
6. **Enterprise Verified**: identity, security, privacy, support, continuity, and contracting controls meet the enterprise profile.
7. **Government Ready**: deployment, data handling, personnel, supply-chain, and control-mapping evidence meets the applicable government profile. This is not IRAP certification.
8. **Independently Audited**: a qualified independent party has issued a current assurance report whose scope covers the represented product or organisation.

## Claim controls

Challenges use 256-bit random values, are stored only as SHA-256 digests, expire after 30 minutes, and have terminal outcomes to prevent replay. DNS checks query the claimed domain. Email challenges prove mailbox control. GitHub and OAuth callbacks require a server-generated HMAC attestation. Signed challenges use a registered public key.

Ownership proof and assurance level are deliberately separate. A successful vendor claim cannot directly grant Security Verified or higher status. Revocation and attempt history remain auditable.
