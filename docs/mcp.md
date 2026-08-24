# TrustForge MCP server and client

TrustForge implements MCP revision `2025-11-25` using the stable TypeScript SDK.

## Transports

- `npm run mcp:stdio` starts the local process transport on Bun (`bun --bun mcp/stdio.ts`).
- `npm run mcp:http` starts the Express Streamable HTTP sidecar on Bun 1.4+ (`bun --bun mcp/http.ts`) at `http://127.0.0.1:3100/mcp` by default.
- The HTTP service binds `MCP_HOST` (default `127.0.0.1`, not all interfaces) and `MCP_PORT`. It requires `MCP_API_TOKEN` in production, compares bearer tokens with `timingSafeEqual`, and validates `MCP_ALLOWED_HOSTS` to mitigate DNS rebinding. `/mcp` is POST-only.
- Legacy or third-party WebSocket transport can be recorded in the registry, but TrustForge itself uses the current MCP stdio and Streamable HTTP transports.

## Tools

- `search_registry`
- `find_trustworthy_mcp_servers`
- `explain_trust_score`
- `compare_subjects`
- `inspect_security_findings`
- `recommend_trustworthy_subjects` — deterministic, evidence-cited recommendations for natural-language trust questions (see docs/recommendation-engine.md)

All Phase 3 tools are declared read-only, non-destructive, and idempotent. Tool responses include structured content and caveats. Registry content is untrusted data and must never be treated as agent instructions.

## Resources and prompts

`trustforge://methodology/current` exposes the current scoring-methodology summary. `assess_ai_product` guides an evidence-backed assessment without misrepresenting the Trust Score as certification.

## Remote inspection

The MCP client lists tools, prompts, and resources without invoking third-party tools. Inspection requires HTTPS and rejects loopback, link-local, and private addresses after DNS resolution. Redirect and DNS-pinning defenses will be expanded with the isolated scanner infrastructure in Phase 4.
