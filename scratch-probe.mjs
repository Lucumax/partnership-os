import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
const outDir = "C:/Users/crist/AppData/Local/Temp/claude/C--Walter/1e3c6a98-1d66-4996-837b-d610a0d813c5/scratchpad";
for (const width of [1280, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://127.0.0.1:3000/opportunities/atlas/negotiation", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}/negotiation-${width}.png`, fullPage: true });
  await page.goto("http://127.0.0.1:3000/opportunities/atlas/valuation", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}/valuation-${width}.png`, fullPage: true });
}
await browser.close();
console.log("done");
