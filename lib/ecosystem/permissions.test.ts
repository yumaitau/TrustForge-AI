import { describe, expect, it } from "vitest";
import { assessPermissionRisk } from "./permissions";

describe("MCP permission assessment", () => {
  it("makes high-impact permissions explicit", () => {
    const result = assessPermissionRisk({ filesystem: [{ path: "/", access: "read_write" }], network: [{ host: "*" }], processExecution: true, secrets: ["GITHUB_TOKEN"] });
    expect(result.level).toBe("critical");
    expect(result.findings).toEqual(expect.arrayContaining([expect.stringContaining("filesystem"), "Unrestricted network access", "Can execute local processes"]));
  });
  it("does not invent risk when no permissions are requested", () => expect(assessPermissionRisk({})).toEqual({ score: 0, level: "low", findings: [] }));
});
