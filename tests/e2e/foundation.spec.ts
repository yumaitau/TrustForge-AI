import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
});
