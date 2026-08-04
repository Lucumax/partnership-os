import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/opportunities/atlas",
  "/opportunities/atlas/proposal",
  "/opportunities/atlas/valuation",
  "/comparables",
  "/opportunities/atlas/negotiation",
  "/opportunities/atlas/audit",
];

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

test("theme tokens are applied to the rendered body", async ({ page }) => {
  await page.goto("/");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).not.toBe("rgb(255, 255, 255)");
  const fg = await page.evaluate(() => getComputedStyle(document.body).color);
  expect(fg).not.toBe("rgb(0, 0, 0)");
});
