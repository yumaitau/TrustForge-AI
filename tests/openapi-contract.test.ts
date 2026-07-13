import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = process.cwd();
const V1_DIR = path.join(ROOT, "app/api/v1");
const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

/** Walks the v1 route tree and returns { "/openapi/path": Set(methods) } derived from route.ts exports. */
function discoverV1Routes(dir: string, prefix = ""): Record<string, Set<string>> {
  const routes: Record<string, Set<string>> = {};
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      const segment = entry.replace(/\[(\.\.\.)?([^\]]+)\]/g, "{$2}");
      Object.assign(routes, discoverV1Routes(full, `${prefix}/${segment}`));
    } else if (entry === "route.ts") {
      const source = readFileSync(full, "utf8");
      const methods = new Set(HTTP_METHODS.filter((m) => new RegExp(`export async function ${m.toUpperCase()}\\b`).test(source)));
      if (methods.size) routes[prefix || "/"] = methods;
    }
  }
  return routes;
}

const spec = yaml.load(readFileSync(path.join(ROOT, "public/openapi.yaml"), "utf8")) as { paths: Record<string, Record<string, unknown>> };
const routes = discoverV1Routes(V1_DIR);

describe("OpenAPI contract covers every v1 route", () => {
  it("parses the spec with a paths object", () => {
    expect(spec.paths).toBeTypeOf("object");
  });

  it.each(Object.entries(routes).map(([p, m]) => [p, [...m].sort().join(",")] as const))(
    "documents %s (%s)",
    (routePath, methodList) => {
      const pathItem = spec.paths[routePath];
      expect(pathItem, `openapi.yaml is missing path ${routePath}`).toBeDefined();
      for (const method of methodList.split(",")) {
        expect(pathItem[method], `openapi.yaml path ${routePath} is missing the ${method.toUpperCase()} operation`).toBeDefined();
      }
    },
  );
});
