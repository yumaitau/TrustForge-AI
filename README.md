# TrustForge AI

TrustForge AI is an evidence-backed trust registry for AI companies, products, models, APIs, agents, skills, and MCP servers.

This repository is being built incrementally. The current milestone establishes the Phase 1 application shell, domain model, trust-scoring primitives, multi-tenant boundary, local infrastructure, and architectural documentation.

## Local development

Requirements: Node.js 20+, npm, and Docker.

```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
- [Trust methodology](docs/trust-methodology.md)
- [Security model](docs/security/threat-model.md)
- [Roadmap](docs/roadmap.md)

The GitHub Issues roadmap is the living source of delivery work. `docs/roadmap.md` defines the phase taxonomy and roadmap maintenance policy.
