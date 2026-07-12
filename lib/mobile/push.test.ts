import { describe, expect, it } from "vitest";
import { buildPushMessage } from "./push";

describe("buildPushMessage (content-free payload policy)", () => {
  const alert = { id: "alert-1", subjectType: "product", subjectId: "subject-1", kind: "new_finding" };

  it("carries subject references and alert kind only", () => {
    const message = buildPushMessage(alert, "ExponentPushToken[abc]");
    expect(message.data).toEqual({ alertId: "alert-1", subjectType: "product", subjectId: "subject-1", kind: "new_finding" });
    expect(message.to).toBe("ExponentPushToken[abc]");
  });

  it("never embeds registry names, scores, severities, or finding titles", () => {
    const message = buildPushMessage({ ...alert, kind: "score_drop" }, "token");
    const serialized = JSON.stringify(message);
    expect(message.title).toBe("Trust score changed");
    expect(serialized).not.toMatch(/severity|critical|score[":]?\s*\d/i);
  });

  it("uses a generic title for unknown kinds rather than leaking payload data", () => {
    expect(buildPushMessage({ ...alert, kind: "future_kind" }, "token").title).toBe("Trust alert");
  });
});
