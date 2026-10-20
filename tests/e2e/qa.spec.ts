import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/opportunities",
  "/opportunities/atlas",
  "/opportunities/atlas/proposal",
  "/opportunities/atlas/valuation",
  "/comparables",
  "/opportunities/atlas/negotiation",
  "/opportunities/atlas/audit",
];

const ARTIFACT_MARKERS = ["NaN", "$NaN", "Infinity", "undefined", "[object Object]"];

test("every route renders without console or page errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  for (const route of ROUTES) {
    const resp = await page.goto(route, { waitUntil: "networkidle" });
    expect(resp?.status(), `${route} should return 200`).toBe(200);
    const html = await page.content();
    expect(html.length, `${route} should render content`).toBeGreaterThan(2000);
    // No skeleton/crash markers
    expect(html, `${route} must not render the Next error boundary`).not.toContain("Application error");
  }

  expect(consoleErrors, "no console/page errors on any route").toEqual([]);
});

test("no render artifacts (NaN, Infinity, undefined, empty cells) on any route", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });
    const text = await page.locator("body").innerText();
    for (const marker of ARTIFACT_MARKERS) {
      expect(text, `${route} must not contain "${marker}"`).not.toContain(marker);
    }
    const emptyCells = await page.locator("td").evaluateAll((cells) =>
      cells.filter((cell) => {
        if (cell.textContent?.trim() !== "") {
          return false;
        }
        // Editable cells (inputs/selects) are intentionally text-less.
        return cell.querySelector("input, select, button, textarea, [contenteditable]") === null;
      }).length,
    );
    expect(emptyCells, `${route} must not render empty table cells`).toBe(0);
  }
});

test("Atlas figures agree across dashboard, overview, and valuation workbench", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("$25.2M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("−$5.8M", { exact: true }).first()).toBeVisible();

  await page.goto("/opportunities/atlas");
  await expect(page.getByText("$35.0M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$25.2M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("−$5.8M", { exact: true }).first()).toBeVisible();

  await page.goto("/opportunities/atlas/valuation");
  await expect(page.getByText("$35.0M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$25.2M", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("−$5.8M", { exact: true }).first()).toBeVisible();
});

test("theme tokens are applied to the rendered body", async ({ page }) => {
  await page.goto("/");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).not.toBe("rgb(255, 255, 255)");
  const fg = await page.evaluate(() => getComputedStyle(document.body).color);
  expect(fg).not.toBe("rgb(0, 0, 0)");
});

test("no horizontal overflow at 1280px and 1440px on any route", async ({ page }) => {
  for (const width of [1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: "networkidle" });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        scrollWidth,
        `${route} @ ${width}px must not overflow horizontally (${scrollWidth} > ${clientWidth})`,
      ).toBeLessThanOrEqual(clientWidth);
    }
  }
});
