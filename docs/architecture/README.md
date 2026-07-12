# Architecture

TrustForge starts as a modular monolith with explicit domain boundaries. This minimizes operational overhead while allowing high-volume capabilities such as scanning, search, and continuous monitoring to move into independent services later.

## Initial modules

- **Identity and tenancy**: users, credentials, organisations, membership, policy, and authorization.
- **Registry**: companies and typed AI products. MCP servers, skills, agents, models, and APIs are product specializations, not isolated silos.
- **Evidence**: provenance, confidence, observation time, validity, adjudication, and content integrity.
- **Trust scoring**: versioned methodology, dimension components, evidence links, and reproducible explanations.
- **Audit**: append-oriented records of security and business events.

## Dependency rule

Domain modules may depend on shared primitives. Delivery adapters (web, REST, GraphQL, MCP, workers) depend on domain services. Domain services never import delivery code.

## Deployment model

The web application and API begin in Next.js. PostgreSQL is authoritative storage, Redis is ephemeral coordination and caching, and S3-compatible storage holds evidence artifacts. Workers will consume durable events through an outbox-backed queue in a later milestone.

## API strategy

REST is the first stable public contract. GraphQL, tRPC for first-party application flows, and MCP tools will compose the same application services. No transport owns business rules.
