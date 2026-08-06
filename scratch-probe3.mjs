import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto("http://127.0.0.1:3000/opportunities/atlas/negotiation", { waitUntil: "networkidle" });
await page.screenshot({ path: "C:/Users/crist/AppData/Local/Temp/claude/C--Walter/1e3c6a98-1d66-4996-837b-d610a0d813c5/scratchpad/negotiation-1280-v2.png", fullPage: true });
const info = await page.evaluate(() => {
  const containers = [...document.querySelectorAll('[data-slot="table-container"]')].map((c) => ({
    clientWidth: c.clientWidth,
    scrollWidth: c.scrollWidth,
  }));
  return { count: containers.length, containers };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
