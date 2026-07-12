import type { McpPermissions } from "@/db/schema";

export type PermissionRisk = { level: "low" | "medium" | "high" | "critical"; score: number; findings: string[] };

export function assessPermissionRisk(permissions: McpPermissions): PermissionRisk {
  let score = 0; const findings: string[] = [];
  for (const entry of permissions.filesystem ?? []) {
    if (["/", "~", "*"].includes(entry.path)) { score += entry.access === "read" ? 35 : 60; findings.push(`Broad ${entry.access} filesystem access: ${entry.path}`); }
    else if (entry.access !== "read") { score += 20; findings.push(`Filesystem write access: ${entry.path}`); }
    else score += 5;
  }
  for (const entry of permissions.network ?? []) {
    if (["*", "0.0.0.0", "::/0"].includes(entry.host)) { score += 35; findings.push("Unrestricted network access"); }
    else score += 5;
  }
  if (permissions.processExecution) { score += 35; findings.push("Can execute local processes"); }
  if ((permissions.secrets?.length ?? 0) > 0) { score += Math.min(30, permissions.secrets!.length * 5); findings.push(`Requires ${permissions.secrets!.length} secret value(s)`); }
  score = Math.min(100, score);
  return { score, findings, level: score >= 80 ? "critical" : score >= 50 ? "high" : score >= 20 ? "medium" : "low" };
}
