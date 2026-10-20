import { test, expect } from "@playwright/test";

/**
 * Demo-flow smoke test (original acceptance criteria, demo script).
 * Walks the Atlas case: dashboard -> overview -> valuation -> comparables
 * -> negotiation -> audit. Asserts the seeded engine numbers render.
 */

test("full demo path renders the Atlas case with seeded numbers", async ({ page }) => {
  // 1. Dashboard (minute 0)
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Partnership portfolio/i })).toBeVisible();
  await expect(page.getByText("Atlas Knowledge Systems", { exact: false }).first()).toBeVisible();

  // 2. Overview (minute 0-1)
  await page.goto("/opportunities/atlas");
  await expect(page.getByText("Atlas Knowledge Systems", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Archetype Hybrid", { exact: false }).first()).toBeVisible();

  // 3. Valuation (minute 1-2): seeded scenario values
  await page.goto("/opportunities/atlas/valuation");
  await expect(page.getByText("$14.0M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$7.7M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$35.0M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$25.2M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$62.0M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$48.4M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("−$23.3M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("−$5.8M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("+$17.4M", { exact: true }).first()).toBeVisible();

  // 4. Comparables (minute 2-3): five rows present
  await page.goto("/comparables");
  await expect(page.getByText("Northstar Data License", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Pioneer Hybrid Agreement", { exact: false }).first()).toBeVisible();

  // 5. Negotiation (minute 3-4): pilot decision + anchors
  await page.goto("/opportunities/atlas/negotiation");
  await expect(page.getByText("Decision · Pilot", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("$7.7M", { exact: true }).first()).toBeVisible();
  // Target is the midpoint of the opening anchor (downside CAV, $7.7M) and the
  // reservation ceiling (base CAV, $25.2M) -- not the old base/upside midpoint
  // ($36.8M), which mixed a price position with the unpriced upside case. See
  // computeRecommendation in src/lib/valuation/engine.ts and the matching
  // comment in src/lib/export/__tests__/export.test.ts.
  await expect(page.getByText("$16.4M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$25.2M", { exact: true }).first()).toBeVisible();
  // Walk-away threshold restates the reservation ceiling (base CAV) in nominal
  // cash terms (reservationValueUsd * nominalToPresentValueRatio) -- not the
  // old $48.4M (upside CAV), which is a different, unrelated scenario figure.
  // See computeRecommendation in src/lib/valuation/engine.ts.
  await expect(page.getByText("$30.5M", { exact: true }).first()).toBeVisible();

  // 6. Audit (minute 4-5): timeline + approval
  await page.goto("/opportunities/atlas/audit");
  await expect(page.getByText("recommendation.generated", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("assumption.updated", { exact: false }).first()).toBeVisible();
  const approve = page.getByRole("button", { name: /Approve decision/i });
  if (await approve.count()) {
    await approve.first().click();
    await expect(page.getByText("decision.approved", { exact: false }).first()).toBeVisible();
  }
});

test("negotiation export button triggers a markdown download", async ({ page }) => {
  await page.goto("/opportunities/atlas/negotiation");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export Markdown/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("atlas-negotiation-brief.md");
});
