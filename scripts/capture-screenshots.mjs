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
import { spawn, spawnSync } from "node:child_process";
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
      if (process.platform === "win32" && server.pid) {
        // On Windows, spawning through a shell (required for npx) means
        // `server` is the cmd.exe wrapper, not the actual next-server
        // process it launches. server.kill() only signals that wrapper --
        // the real next-server grandchild survives as a zombie holding the
        // port. A later run of this script then binds waitForServer() to
        // that stale, orphaned server instead of the fresh one it just
        // spawned, silently screenshotting an old build (observed as
        // "blank charts" from a 500 on a since-removed chunk hash).
        // taskkill /T kills the whole process tree instead of just the
        // wrapper.
        spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      } else {
        server.kill("SIGTERM");
      }
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

      // The app shell (src/app/layout.tsx) pins <body> to the viewport height
      // and scrolls only the inner <main id="main"> region (h-screen
      // overflow-hidden on the shell, overflow-y-auto on <main>). Playwright's
      // fullPage:true measures the *document's* scroll height, which this
      // layout keeps pinned at exactly one viewport tall -- so a plain
      // fullPage screenshot silently captures only whatever fits above the
      // fold and drops everything a reviewer would have had to scroll `main`
      // to see. Release the shell's height/overflow constraints so the whole
      // document grows to its natural content height before shooting, then
      // fullPage:true captures everything for real.
      await page.evaluate(() => {
        const main = document.getElementById("main");
        if (main) {
          main.style.overflow = "visible";
          main.style.height = "auto";
        }
        const shell = main ? main.closest(".h-screen") : null;
        if (shell) {
          shell.style.height = "auto";
          shell.style.overflow = "visible";
          // Without this, the sidebar (h-full) stretches to match the now much
          // taller content column instead of keeping its own natural height.
          shell.style.alignItems = "flex-start";
        }
      });

      // The overflow/height release above reflows the whole page, which
      // fires Recharts' ResizeObserver on every chart's ResponsiveContainer.
      // That callback re-measures and re-renders asynchronously; taking the
      // screenshot in the same tick can catch a chart mid-remeasure with a
      // transient 0-size box, which Recharts renders as an empty <svg> that
      // never gets a follow-up paint before the capture. A short settle wait
      // gives every ResizeObserver callback (and its re-render) time to land
      // before we shoot.
      await page.waitForTimeout(500);

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
