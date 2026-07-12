# AI ecosystem registries

AI ecosystem profiles extend canonical products instead of creating disconnected identity silos.

## MCP servers

Profiles record publisher, maintainer, package identity, repository, documentation, transports, filesystem/network/secrets/user-data permissions, authentication, OAuth, sandbox compatibility, enterprise readiness, maintenance state, releases, signatures, SBOM links, and dependencies. Permission risk is deterministic and shown separately from the Trust Score.

## Skills

Skills support ChatGPT, Claude, MCP, and custom formats with versioned manifests, capabilities, requested permissions, and compatible hosts.

## Agents

Agents record capabilities, permissions, autonomy level, deployment modes, and model dependencies.

## Models

Models record family, provider identifier, modalities, context window, weight availability, license, training-data summary, and safety documentation.

## APIs

API profiles record base URL, authentication, protocols, data-residency regions, retention, training usage, SLA, and pricing references.

Each profile is available through REST and first-party tRPC routes. Public search, MCP discovery, and current trust data are also available through GraphQL and TrustForge MCP tools.
