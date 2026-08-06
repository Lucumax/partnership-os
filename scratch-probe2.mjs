import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto("http://127.0.0.1:3000/opportunities/atlas/negotiation", { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const container = document.querySelector('[data-slot="table-container"]');
  const table = container.querySelector("table");
  const headCells = [...table.querySelectorAll("thead th")].map((th) => ({
    text: th.textContent.trim(),
    width: th.getBoundingClientRect().width,
  }));
  const card = container.closest('[data-slot="card"]') || container.closest(".h-full");
  return {
    containerClientWidth: container.clientWidth,
    containerScrollWidth: container.scrollWidth,
    tableWidth: table.getBoundingClientRect().width,
    cardWidth: card ? card.getBoundingClientRect().width : null,
    headCells,
    sectionWidth: document.querySelector("section:nth-of-type(2)")?.getBoundingClientRect().width,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
