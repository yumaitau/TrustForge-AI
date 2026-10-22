# TrustForge AI

TrustForge AI is an evidence-backed trust registry for AI companies, products, models, APIs, agents, skills, and MCP servers.

This repository is being built incrementally. The current milestone establishes the Phase 1 application shell, domain model, trust-scoring primitives, multi-tenant boundary, local infrastructure, and architectural documentation.

## Local development

Requirements: Node.js 22.23.4+ (22.x; `nvm use`) for the Next.js app, Bun 1.4+ for the MCP sidecar, npm, and Docker.

```bash
cp .env.example .env.local
docker compose up -d postgres redis object-storage
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To run the complete containerized web and MCP stack after migrating the database:

```bash
docker compose up --build
```

The MCP Streamable HTTP sidecar runs on Bun (`npm run mcp:http`) at `http://localhost:3100/mcp`. `MCP_API_TOKEN` is required in production. The Next.js `dev` / `build` / `start` scripts stay on Node.

Node image stages are pinned to 22.23.4 for the [October 2026 security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases), including CVE-2026-111497 (Brotli RCE), CVE-2026-105482 (DNS NUL truncation), and CVE-2026-106069 (TLS hostname bypass). CVE-2026-105483 affects Node 24/26, not this Node 22 runtime. Existing deployments require a rebuild and redeploy to pick up the fixes; Justin must approve the redeploy separately from issue #46.

Rebuild and verify the web runtime and the MCP Node dependency stage before deployment:

```bash
docker build --pull --no-cache -t trustforge-ai:node-22.23.4 .
docker run --rm --entrypoint node trustforge-ai:node-22.23.4 --version
docker build --pull --no-cache -f Dockerfile.mcp --target dependencies -t trustforge-mcp-deps:node-22.23.4 .
docker run --rm --entrypoint node trustforge-mcp-deps:node-22.23.4 --version
docker build --pull --no-cache -f Dockerfile.mcp -t trustforge-mcp:node-22.23.4 .
```

Both Node checks should report `v22.23.4`. CI currently selects the latest Node 22 via `setup-node`; its workflow is maintained separately from this patch.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Documentation

- [Architecture](docs/architecture/README.md)
- [ADR 0001: Modular monolith](docs/adr/0001-modular-monolith.md)
- [ADR 0005: MCP Express sidecar on Bun](docs/adr/0005-mcp-express-on-bun.md)
- [Trust methodology](docs/trust-methodology.md)
- [Security model](docs/security/threat-model.md)
- [Roadmap](docs/roadmap.md)
- [Authentication and identity](docs/authentication.md)
- [API conventions](docs/api.md)
- [Verification methodology](docs/verification-methodology.md)
- [Community and reputation](docs/community-and-reputation.md)
- [AI ecosystem registries](docs/ecosystem-registry.md)
- [MCP server and client](docs/mcp.md)

The GitHub Issues roadmap is the living source of delivery work. `docs/roadmap.md` defines the phase taxonomy and roadmap maintenance policy.
