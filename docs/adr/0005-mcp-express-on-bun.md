# ADR 0005: Run the MCP Express sidecar on Bun

- Status: Accepted
- Date: 2026-08-24

## Context

TrustForge's Streamable HTTP MCP server is an Express sidecar (`mcp/http.ts`), not the Next.js application. The web app remains on Next.js 16 / Node.js 20+. The sidecar already uses the official MCP SDK (`createMcpExpressApp`), Bearer `MCP_API_TOKEN` comparison with `timingSafeEqual`, host allow-listing, health on `GET /health`, and POST-only `/mcp`.

## Decision

Start and package the MCP HTTP and stdio entrypoints with Bun 1.4+ (`bun --bun mcp/http.ts`, `bun --bun mcp/stdio.ts`, and `bun build` for the container artifact). Next.js `dev`, `build`, and `start` stay on Node. Default bind remains `127.0.0.1`; containers set `MCP_HOST=0.0.0.0` explicitly.

## Consequences

- Local MCP and `mcp:smoke` run against a Bun process.
- `Dockerfile.mcp` uses `oven/bun:1.4-alpine` for the sidecar image.
- The Next.js application and npm lockfile remain the web toolchain.
- Bearer comparison and localhost-default bind are unchanged.
