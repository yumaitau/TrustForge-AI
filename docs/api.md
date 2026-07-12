# API conventions

- Public REST routes are versioned below `/api/v1`.
- Collection responses use `items` and opaque `nextCursor` fields.
- Mutation responses wrap resources in `data`.
- Errors use `{ error: { code, message, details? } }` and stable machine-readable codes.
- IDs are UUIDs. Application-created registry records use time-ordered UUIDv7.
- Authentication and tenant authorization are server-side requirements for mutations.
- GraphQL, tRPC, and MCP adapters must call the same application services rather than duplicate business rules.

The machine-readable contract is published at `/openapi.yaml`.

Public GraphQL queries are served at `/api/graphql`. First-party type-safe procedures are served below `/api/trpc`. Both compose the same repository and trust services used by REST and MCP.
