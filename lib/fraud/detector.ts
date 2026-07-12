import { createHash } from "node:crypto";

export type ReviewObservation = { userId: string; content: string; createdAt: Date };
export type FraudFinding = { signal: "duplicate_content" | "review_burst" | "account_cluster"; severity: number; confidence: number; explanation: string };

const normalizedHash = (content: string) => createHash("sha256").update(content.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");

export function detectReviewFraud(observations: readonly ReviewObservation[]): FraudFinding[] {
  const findings: FraudFinding[] = [];
  const hashUsers = new Map<string, Set<string>>();
  for (const item of observations) {
    const hash = normalizedHash(item.content); const users = hashUsers.get(hash) ?? new Set<string>(); users.add(item.userId); hashUsers.set(hash, users);
  }
  if ([...hashUsers.values()].some((users) => users.size >= 2)) findings.push({ signal: "duplicate_content", severity: 70, confidence: 0.95, explanation: "Substantially identical review content was submitted by multiple accounts." });
  if (observations.length >= 5) {
    const sorted = [...observations].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (sorted.at(-1)!.createdAt.getTime() - sorted[0].createdAt.getTime() <= 10 * 60_000) findings.push({ signal: "review_burst", severity: 55, confidence: 0.8, explanation: "Five or more reviews arrived inside a ten-minute window." });
  }
  return findings;
}

export function reviewContentHash(title: string, body: string) { return normalizedHash(`${title}\n${body}`); }
