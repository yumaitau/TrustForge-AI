# ADR 0001: Begin as a modular monolith

- Status: Accepted
- Date: 2026-07-12

## Context

TrustForge spans identity, registries, verification, scoring, community, security intelligence, enterprise workflows, and agent interoperability. These domains will have different scaling profiles, but their boundaries and data contracts will evolve rapidly during discovery.

## Decision

Begin with a TypeScript modular monolith deployed through Next.js, PostgreSQL, Redis, and S3-compatible object storage. Keep domain logic independent of App Router, database transport details where practical, and external API protocols. Introduce an outbox before asynchronous side effects become business-critical.

## Consequences

- Local development and air-gapped deployment remain approachable.
- Transactions across early domain boundaries are reliable.
- Modules can be extracted when measured load or isolation requirements justify it.
- Boundary tests and import discipline are required to prevent an accidental big ball of mud.
