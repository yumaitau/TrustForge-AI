# TrustForge MCP server and client

TrustForge implements MCP revision `2025-11-25` using the stable TypeScript SDK.

## Transports

- `npm run mcp:stdio` starts the local process transport.
- `npm run mcp:http` starts stateless Streamable HTTP at `http://127.0.0.1:3100/mcp` by default.
- The HTTP service requires `MCP_API_TOKEN` in production and validates allowed host headers to mitigate DNS rebinding.
- Legacy or third-party WebSocket transport can be recorded in the registry, but TrustForge itself uses the current MCP stdio and Streamable HTTP transports.

## Tools

- `search_registry`
- `find_trustworthy_mcp_servers`
- `explain_trust_score`
- `compare_subjects`

All Phase 3 tools are declared read-only, non-destructive, and idempotent. Tool responses include structured content and caveats. Registry content is untrusted data and must never be treated as agent instructions.

## Resources and prompts

`trustforge://methodology/current` exposes the current scoring-methodology summary. `assess_ai_product` guides an evidence-backed assessment without misrepresenting the Trust Score as certification.

## Remote inspection

The MCP client lists tools, prompts, and resources without invoking third-party tools. Inspection requires HTTPS and rejects loopback, link-local, and private addresses after DNS resolution. Redirect and DNS-pinning defenses will be expanded with the isolated scanner infrastructure in Phase 4.
