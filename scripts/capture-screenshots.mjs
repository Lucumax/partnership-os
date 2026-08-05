#!/usr/bin/env node
/**
 * Regenerate the full-page screenshots in docs/screenshots/.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs          # builds, starts a prod server, captures
 *   node scripts/capture-screenshots.mjs --no-build   # reuse the existing .next build
 *
 * Output: docs/screenshots/01-dashboard.png … 07-audit.png
 * Each capture uses a 1440x900 viewport at deviceScaleFactor 2 (Retina-sharp).
 * Screenshots are taken against the PRODUCTION build so the Next.js dev-tools
 * indicator can never appear, and the script waits for charts to finish their
 * entrance animation before shooting.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve("docs/screenshots");

const SHOTS = [
  { route: "/", name: "01-dashboard.png" },
  { route: "/opportunities", name: "02-opportunities.png" },
  { route: "/opportunities/atlas", name: "03-overview.png" },
  { route: "/opportunities/atlas/valuation", name: "04-valuation.png" },
  { route: "/comparables", name: "05-comparables.png" },
  { route: "/opportunities/atlas/negotiation", name: "06-negotiation.png" },
  { route: "/opportunities/atlas/audit", name: "07-audit.png" },
];

// Wait long enough for Recharts' entrance animations to settle so no capture
// shows a partially-rendered chart.
const CHART_SETTLE_MS = 2500;

function log(message) {
  process.stdout.write(`[capture] ${message}\n`);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)),
    );
  });
}

async function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        return;
      }
    } catch {
      // server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready at ${url}`);
}

async function main() {
  const skipBuild = process.argv.includes("--no-build");

  if (!skipBuild) {
    log("rebuilding the production app so screenshots match the current source");
    await runCommand("npm", ["run", "build"]);
  } else if (!existsSync(path.resolve(".next"))) {
    throw new Error("No .next build found; run without --no-build first");
  }

  await mkdir(OUT_DIR, { recursive: true });

  log(`starting production server on port ${PORT}`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  const cleanup = () => {
    try {
      server.kill("SIGTERM");
    } catch {
      // already gone
    }
  };
  process.on("exit", cleanup);

  try {
    await waitForServer(`${BASE_URL}/`);

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });

    for (const { route, name } of SHOTS) {
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
      // Give charts time to finish animating and the viewport to settle.
      await page.waitForTimeout(CHART_SETTLE_MS);

      const html = await page.content();
      if (html.includes("Application error")) {
        throw new Error(
          `route ${route} rendered the Next.js error boundary; refusing to screenshot`,
        );
      }

      const target = path.join(OUT_DIR, name);
      await page.screenshot({ path: target, fullPage: true });
      log(`wrote ${name} (${route})`);
      await page.close();
    }

    await browser.close();
  } finally {
    cleanup();
  }

  log(`done — ${SHOTS.length} screenshots in ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
