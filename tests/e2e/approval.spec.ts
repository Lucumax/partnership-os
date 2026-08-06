import { test, expect } from "@playwright/test";

/**
 * Regression test for a state-consistency bug: each interactive island on
 * the audit and negotiation pages used to hold its own local approval
 * state, so clicking "approve" in one place left an adjacent element still
 * showing "awaiting". A reviewer clicking the approve button -- something
 * the demo script actively invites -- would see contradictory approval
 * text on screen at the same time.
 *
 * The existing suite only asserts on initial page load, which structurally
 * cannot catch a bug that only appears after an interaction. These tests
 * click the approve control and then check the *entire* rendered page for
 * leftover "awaiting" text once it claims to be approved.
 */

test.describe("approval state stays consistent after clicking approve", () => {
  test("audit page: approving the decision updates the timeline banner and the Q7 answer together", async ({
    page,
  }) => {
    await page.goto("/opportunities/atlas/audit", { waitUntil: "networkidle" });

    // Before approval every approval-dependent element agrees nothing has
    // been signed off yet.
    let text = await page.locator("body").innerText();
    expect(text).toContain("Awaiting human approval");
    expect(text).toContain(
      "Decision approval: awaiting human sign-off (use Approve decision).",
    );
    expect(text).not.toMatch(/Decision approved/);

    const approveButton = page.getByRole("button", { name: /Approve decision/i });
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // The timeline banner flips to approved...
    await expect(page.getByText("Decision approved", { exact: false })).toBeVisible();

    // ...and so does everything else on the page: the Q7 explainability
    // answer and the header AI label. Nothing may still read "awaiting".
    text = await page.locator("body").innerText();
    expect(
      text,
      "no element on the audit page may still say 'awaiting' once the decision is approved",
    ).not.toMatch(/awaiting/i);
    expect(text).toMatch(/Decision approval: approved by/);

    // Approval remains an explicit, one-way human action -- the control does
    // not silently re-arm or allow approving twice from a stale UI.
    await expect(approveButton).toBeDisabled();
  });

  test("negotiation page: approving the brief updates the header badge, AI label, and action bar together", async ({
    page,
  }) => {
    await page.goto("/opportunities/atlas/negotiation", { waitUntil: "networkidle" });

    // Before approval every approval-dependent element (header badge, header
    // AI label, "Where we stand" AI label, action bar) agrees it is awaiting.
    let text = await page.locator("body").innerText();
    expect(text).toContain("Awaiting approval");
    expect(text).not.toMatch(/Brief approved/);

    const approveButton = page.getByRole("button", { name: /Approve brief/i });
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // The action bar flips to approved...
    await expect(page.getByText("Brief approved", { exact: false })).toBeVisible();

    // ...and so does the header badge and every AI label on the page.
    // Nothing may still read "awaiting approval".
    text = await page.locator("body").innerText();
    expect(
      text,
      "no element on the negotiation page may still say 'awaiting' once the brief is approved",
    ).not.toMatch(/awaiting/i);

    // Approval remains an explicit human action that can be revoked -- it is
    // not an irreversible default and it was not pre-applied by the fixture.
    const revokeButton = page.getByRole("button", { name: /Revoke approval/i });
    await expect(revokeButton).toBeVisible();

    // Revoking must bring every element back into agreement too: nothing may
    // still claim "approved" while other elements say "awaiting" again.
    await revokeButton.click();
    await expect(page.getByText("Awaiting approval", { exact: false }).first()).toBeVisible();
    text = await page.locator("body").innerText();
    expect(
      text,
      "no element on the negotiation page may still say 'approved' once approval is revoked",
    ).not.toMatch(/approved/i);
  });
});
