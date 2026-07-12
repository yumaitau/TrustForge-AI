import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { generateKeyPairSync, sign } from "node:crypto";

test("public landing and authentication pages have no detectable WCAG A/AA violations", async ({ page }) => {
  for (const path of ["/", "/sign-in", "/sign-up"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations, `${path}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
  }
});

test("a new user can register, create an organisation, and reach the workspace", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("Phase One Browser Test");
  await page.getByLabel("Work email").fill(`browser-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Create your organisation" })).toBeVisible();
  await page.getByLabel("Organisation name").fill("Browser Test Organisation");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Trust decisions start with evidence." })).toBeVisible();

  const companyResponse = await page.request.post("/api/v1/companies", { data: { legalName: "Phase Two Labs Pty Ltd", displayName: `Phase Two Labs ${Date.now()}`, websiteUrl: "https://example.com", countryCode: "AU" } });
  expect(companyResponse.status()).toBe(201);
  const company = (await companyResponse.json()).data;
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const claimResponse = await page.request.post("/api/v1/claims", { data: { subjectType: "company", subjectId: company.id, method: "signed_challenge", publicKey: publicKey.export({ type: "spki", format: "pem" }).toString() } });
  expect(claimResponse.status()).toBe(201);
  const claimData = (await claimResponse.json()).data;
  const signature = sign(null, Buffer.from(claimData.challenge), privateKey).toString("base64");
  const verifyClaimResponse = await page.request.post(`/api/v1/claims/${claimData.claim.id}/verify`, { data: { challenge: claimData.challenge, signature } });
  expect(verifyClaimResponse.status()).toBe(200);
  expect((await verifyClaimResponse.json()).data.status).toBe("verified");
  expect((await (await page.request.get(`/api/v1/companies/${company.id}`)).json()).data.verificationLevel).toBe("organisation_verified");
  const evidenceResponse = await page.request.post("/api/v1/evidence", { data: { subjectType: "company", subjectId: company.id, type: "signed_releases", dimension: "security", value: 90, title: "Signed releases verified", summary: "Release signatures were independently checked against the published maintainer keys.", source: "independent_audit", confidence: 1, observedAt: new Date().toISOString() } });
  expect(evidenceResponse.status()).toBe(201);
  const evidence = (await evidenceResponse.json()).data;
  expect((await page.request.post(`/api/v1/evidence/${evidence.id}/adjudicate`, { data: { status: "verified" } })).status()).toBe(200);
  expect((await page.request.post(`/api/v1/trust-scores/company/${company.id}/recalculate`)).status()).toBe(201);
  const score = await (await page.request.get(`/api/v1/trust-scores/company/${company.id}`)).json();
  expect(Number(score.data.score)).toBeGreaterThan(50);

  const reviewResponse = await page.request.post("/api/v1/reviews", { data: { subjectType: "company", subjectId: company.id, title: "Clear security documentation", body: "The security documentation was current, specific, and straightforward to validate during our internal assessment process.", rating: 4, verifiedUse: true, useCase: "Enterprise security review" } });
  expect(reviewResponse.status()).toBe(201);
  expect((await reviewResponse.json()).data.review.status).toBe("published");

  const mcpResponse = await page.request.post("/api/v1/mcp-servers", { data: { name: `Secure Git MCP ${Date.now()}`, description: "A constrained repository inspection server used by the Phase 3 end-to-end test.", repositoryUrl: "https://github.com/example/secure-git-mcp", openSource: true, maintainer: "Example Maintainers", documentationUrl: "https://example.com/docs", packageIdentifier: `npm:@example/secure-git-mcp-${Date.now()}`, transports: ["stdio", "http"], permissions: { filesystem: [{ path: "./repository", access: "read" }], network: [{ host: "api.github.com", ports: [443] }] }, authenticationMethods: ["oauth2"], secretsRequired: ["GITHUB_TOKEN"], oauthSupported: true, sandboxCompatible: true, enterpriseReady: true, maintenanceStatus: "active" } });
  expect(mcpResponse.status()).toBe(201);
  const mcp = (await mcpResponse.json()).data;
  expect(mcp.permissionRisk.level).toBe("low");
  expect((await page.request.post(`/api/v1/mcp-servers/${mcp.profile.id}/releases`, { data: { version: "1.0.0", releaseUrl: "https://example.com/releases/1.0.0", signatureVerified: true, publishedAt: new Date().toISOString() } })).status()).toBe(201);
  expect((await page.request.post(`/api/v1/mcp-servers/${mcp.profile.id}/dependencies`, { data: { ecosystem: "npm", packageName: "@modelcontextprotocol/sdk", versionRange: "^1.29.0", direct: true } })).status()).toBe(201);

  expect((await page.request.post("/api/v1/skills", { data: { name: `Trust Review Skill ${Date.now()}`, format: "custom", capabilities: ["trust-score-explanation"], permissions: {}, compatibleHosts: ["TrustForge"], openSource: true } })).status()).toBe(201);
  expect((await page.request.post("/api/v1/agents", { data: { name: `Procurement Agent ${Date.now()}`, capabilities: ["vendor-comparison"], permissions: { network: [{ host: "trustforge.example", ports: [443] }] }, autonomyLevel: 2, deploymentModes: ["self_hosted"], modelDependencies: ["provider:model"], openSource: false } })).status()).toBe(201);
  expect((await page.request.post("/api/v1/models", { data: { name: `Evidence Model ${Date.now()}`, family: "Evidence", providerModelId: `evidence-${Date.now()}`, modalities: ["text"], contextWindow: 128000, openWeights: false, openSource: false } })).status()).toBe(201);
  expect((await page.request.post("/api/v1/apis", { data: { name: `Evidence API ${Date.now()}`, baseUrl: `https://api-${Date.now()}.example.com`, authenticationMethods: ["oauth2"], protocols: ["https"], dataResidencyRegions: ["AU"], retentionSummary: "No request retention.", trainingUsage: "Requests are not used for training.", openSource: false } })).status()).toBe(201);

  const graphqlResponse = await page.request.post("/api/graphql", { data: { query: "query($q: String!) { search(query: $q, limit: 5) { name type verificationLevel } }", variables: { q: "Secure Git MCP" } } });
  expect(graphqlResponse.status()).toBe(200);
  expect(JSON.stringify(await graphqlResponse.json())).toContain("Secure Git MCP");
  expect((await page.request.get("/api/trpc/health")).status()).toBe(200);

  for (const path of ["/dashboard", "/evidence", "/community", "/mcp-servers"]) {
    await page.goto(path);
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(accessibility.violations, `${path}: ${JSON.stringify(accessibility.violations, null, 2)}`).toEqual([]);
  }
});
