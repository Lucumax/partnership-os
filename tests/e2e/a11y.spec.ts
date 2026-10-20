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

test("every route has exactly one h1 and an ordered heading outline", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });

    expect(await page.locator("h1").count(), `${route} must have exactly one h1`).toBe(1);

    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((elements) => elements.map((el) => Number(el.tagName[1])));

    let previous = 0;
    for (const level of levels) {
      expect(
        level,
        `${route} heading levels must not skip (found ${levels.join(" -> ")})`,
      ).toBeLessThanOrEqual(previous + 1);
      previous = level;
    }
  }
});

test("every route has the expected landmarks, lang, and a document title", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });

    expect(await page.locator("main").count(), `${route} must render exactly one main landmark`).toBe(1);

    const navCount = await page.locator("nav").count();
    expect(navCount, `${route} must render at least one nav landmark`).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < navCount; i += 1) {
      const label = await page.locator("nav").nth(i).getAttribute("aria-label");
      expect(label, `${route} nav must carry an aria-label`).toBeTruthy();
    }

    const lang = await page.locator("html").getAttribute("lang");
    expect(lang, `${route} html lang must be en`).toBe("en");

    const title = await page.title();
    expect(title, `${route} must have a non-empty document title`).not.toBe("");
  }
});

test("every table is named and every th has a scope", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });

    const tableCount = await page.locator("table").count();
    for (let i = 0; i < tableCount; i += 1) {
      const table = page.locator("table").nth(i);
      const captionCount = await table.locator("caption").count();
      const ariaLabel = await table.getAttribute("aria-label");
      expect(
        captionCount > 0 || (ariaLabel !== null && ariaLabel.trim().length > 0),
        `${route} table ${i} must be named (caption or aria-label)`,
      ).toBe(true);
    }

    const missingScope = await page
      .locator("th")
      .evaluateAll((cells) =>
        cells
          .filter((cell) => cell.getAttribute("scope") !== "col")
          .map((cell) => cell.textContent?.trim() ?? ""),
      );
    expect(missingScope, `${route} every th must declare scope="col"`).toEqual([]);
  }
});

test("charts expose an accessible name describing data", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });

    const charts = page.locator('[role="img"]');
    const chartCount = await charts.count();
    for (let i = 0; i < chartCount; i += 1) {
      const label = await charts.nth(i).getAttribute("aria-label");
      expect(label, `${route} chart ${i} must have an aria-label`).not.toBeNull();
      expect(
        (label ?? "").length,
        `${route} chart ${i} aria-label must describe real data, not a placeholder`,
      ).toBeGreaterThan(10);
    }
  }
});

test("keyboard navigation: focus is visible and never trapped", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });

    let visitedStops = 0;
    let consecutiveSkips = 0;
    await page.evaluate(() => {
      (globalThis as { __a11yLastFocused?: Element | null }).__a11yLastFocused = null;
    });

    for (let i = 0; i < 50; i += 1) {
      await page.keyboard.press("Tab");

      const state = await page.evaluate(() => {
        const el = document.activeElement;
        const previous = (globalThis as { __a11yLastFocused?: Element | null }).__a11yLastFocused ?? null;
        if (!el || el === document.body) {
          return null;
        }
        const style = getComputedStyle(el);
        const sameAsPrevious = previous === el;
        (globalThis as { __a11yLastFocused?: Element | null }).__a11yLastFocused = el;
        return {
          tag: el.tagName,
          text: (el.textContent ?? "").trim().slice(0, 40),
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow,
          sameAsPrevious,
        };
      });

      if (state === null) {
        consecutiveSkips += 1;
        if (consecutiveSkips >= 3) {
          break;
        }
        continue;
      }
      consecutiveSkips = 0;
      visitedStops += 1;

      expect(
        state.outlineStyle !== "none" || state.boxShadow !== "none",
        `${route}: focused element (${state.tag} "${state.text}") must show a visible focus indicator`,
      ).toBe(true);

      expect(
        state.sameAsPrevious,
        `${route}: focus must move forward on Tab (no trap at ${state.tag} "${state.text}")`,
      ).toBe(false);
    }

    expect(visitedStops, `${route}: tab order must reach at least one focusable element`).toBeGreaterThan(0);
  }
});
