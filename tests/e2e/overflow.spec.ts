import { test, expect } from "@playwright/test";

/**
 * This spec exists because of a real, shipped defect: the give/get matrix on
 * the negotiation page truncated prose ("Renewal option tied to usage and
 * product m...") at 1280px and 1440px. The existing check in qa.spec.ts
 * ("no horizontal overflow at 1280px and 1440px on any route") only reads
 * document.documentElement.scrollWidth vs clientWidth — i.e. page-level
 * overflow. The shadcn Table component (src/components/ui/table.tsx) wraps
 * every table it renders in its own `data-slot="table-container"` div with
 * `overflow-x-auto`. That div swallows the overflow before it ever reaches
 * the page, so document.documentElement never overflows even when a table
 * inside it is nearly twice as wide as the column it lives in. The
 * page-level check is therefore structurally blind to this entire class of
 * bug, no matter how badly a table clips.
 *
 * This spec walks every route, at both reviewer-relevant viewport widths,
 * and inspects the actual scroll containers and table cells directly,
 * instead of trusting page-level metrics.
 */

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

const VIEWPORTS = [1280, 1440] as const;

// Tuned against the concrete measurements behind this spec:
//   - give/get matrix (the confirmed bug): scrollWidth 926 vs clientWidth 464
//     at 1280px -> ~462px / ~2.0x overflow, with a row of prose visibly cut
//     off mid-word in docs/screenshots/06-negotiation.png.
//   - dashboard "recent assumption changes" table: 611 vs 549 -> ~62px /
//     ~1.11x. Reviewer found no visible clipping (short values only).
//   - two atlas-overview tables: ~120px and ~50px over on wider containers.
//     Also no visible clipping (short values only).
// A container only counts as "materially" overflowing — i.e. hiding content
// a reviewer would actually notice missing — when it clears BOTH an
// absolute and a relative bar. That keeps the known-benign ~50-120px cases
// green while still failing hard on anything shaped like the real bug.
const SCROLLABLE_ABS_THRESHOLD_PX = 150;
const SCROLLABLE_RATIO_THRESHOLD = 1.3;

// Elements that overflow but have no scroll mechanism at all (overflow
// hidden/visible) have zero affordance by definition: there is no way for a
// reviewer to ever see the missing content, scrollbar or not. Any material
// overflow there is a defect regardless of ratio.
const NO_AFFORDANCE_ABS_THRESHOLD_PX = 40;

interface ContainerOverflow {
  slot: string;
  tag: string;
  scrollWidth: number;
  clientWidth: number;
  overflowPx: number;
  overflowX: string;
  sample: string;
}

async function findOverflowingContainers(page: import("@playwright/test").Page) {
  return page.evaluate<ContainerOverflow[], { scrollableAbs: number; scrollableRatio: number; noAffordanceAbs: number }>(
    ({ scrollableAbs, scrollableRatio, noAffordanceAbs }) => {
      const results: ContainerOverflow[] = [];
      const seen = new Set<Element>();

      // Every table in this app renders through the shared Table component,
      // which always wraps itself in `[data-slot="table-container"]`
      // (see src/components/ui/table.tsx). That is the exact element that
      // absorbed the give/get overflow without ever surfacing at the page
      // level, so it is checked explicitly and first.
      const candidates = new Set<Element>();
      document
        .querySelectorAll<HTMLElement>('[data-slot="table-container"]')
        .forEach((el) => candidates.add(el));

      // Also sweep every other element in the document for any other
      // horizontally-scrollable region (custom scroll areas, overflowing
      // flex/grid children, etc.) so this test is not hard-coded to the
      // Table component alone.
      document.querySelectorAll<HTMLElement>("body *").forEach((el) => candidates.add(el));

      candidates.forEach((element) => {
        const el = element as HTMLElement;
        if (seen.has(el)) return;
        if (el.clientWidth === 0) return; // not rendered (display:none, etc.)

        // Visually-hidden accessibility content (Tailwind's `sr-only` pattern:
        // width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0)) is used
        // throughout this app for skip links and table captions meant for
        // screen readers only. It is collapsed to a 1x1px box on purpose and
        // is never visible to a sighted reviewer regardless of how wide its
        // text content would naturally be — so it structurally cannot be the
        // kind of "clipped content a reviewer would notice" this spec exists
        // to catch. Detected by actual computed size (not by class name, to
        // stay resilient to markup changes) so real 1x1px-collapsed content
        // is excluded without opening a loophole for larger clipped elements.
        if (el.clientWidth <= 1 && el.clientHeight <= 1) return;

        const overflowPx = el.scrollWidth - el.clientWidth;
        if (overflowPx <= 0) return;

        const style = getComputedStyle(el);
        const canScroll = style.overflowX === "auto" || style.overflowX === "scroll";
        const ratio = el.scrollWidth / el.clientWidth;

        const isViolation = canScroll
          ? overflowPx > scrollableAbs && ratio > scrollableRatio
          : overflowPx > noAffordanceAbs;

        if (!isViolation) return;

        seen.add(el);
        results.push({
          slot: el.getAttribute("data-slot") ?? "",
          tag: el.tagName.toLowerCase(),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          overflowPx,
          overflowX: style.overflowX,
          sample: (el.textContent ?? "").trim().slice(0, 80),
        });
      });

      return results;
    },
    {
      scrollableAbs: SCROLLABLE_ABS_THRESHOLD_PX,
      scrollableRatio: SCROLLABLE_RATIO_THRESHOLD,
      noAffordanceAbs: NO_AFFORDANCE_ABS_THRESHOLD_PX,
    },
  );
}

// Direct root-cause probe: a table cell that is forced to `white-space:
// nowrap` (the TableCell / TableHead default — see table.tsx) while holding
// prose long enough that a reader would notice words missing. This is a
// second, independent signal from the container sweep above: it looks at
// the cell itself rather than at whatever happens to wrap it, so it still
// catches the bug even if some future container isn't a
// `[data-slot="table-container"]` div.
const PROSE_LENGTH_THRESHOLD = 20;
const CELL_OVERFLOW_THRESHOLD_PX = 4;

async function findClippedProseCells(page: import("@playwright/test").Page) {
  return page.locator("td, th").evaluateAll(
    (cells, { proseLength, overflowPx }) => {
      return cells
        .map((cell) => {
          const el = cell as HTMLElement;
          const style = getComputedStyle(el);
          const text = (el.textContent ?? "").trim();
          return {
            text: text.slice(0, 80),
            length: text.length,
            whiteSpace: style.whiteSpace,
            overflow: el.scrollWidth - el.clientWidth,
          };
        })
        .filter(
          (cell) =>
            cell.whiteSpace === "nowrap" &&
            cell.length >= proseLength &&
            cell.overflow > overflowPx,
        );
    },
    { proseLength: PROSE_LENGTH_THRESHOLD, overflowPx: CELL_OVERFLOW_THRESHOLD_PX },
  );
}

// Every route below renders at least one shadcn Table except the proposal
// editor, which is form/card-based. Kept explicit (rather than a shared
// counter in an afterAll) because tests run fullyParallel across worker
// processes — a module-level counter would not reliably accumulate across
// workers, whereas this guards against selector rot on every single test.
const ROUTES_WITHOUT_TABLES = new Set(["/opportunities/atlas/proposal"]);

test.describe("no clipped content in tables or scroll containers", () => {
  for (const width of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route} @ ${width}px has no materially clipped table/scroll content`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "networkidle" });

        // Guard against silent selector rot: if `[data-slot="table-container"]`
        // ever stops matching anything (e.g. the shadcn Table markup
        // changes), the checks below would trivially pass on an empty set
        // and this spec would silently stop testing anything.
        const tableContainerCount = await page
          .locator('[data-slot="table-container"]')
          .count();
        if (!ROUTES_WITHOUT_TABLES.has(route)) {
          expect(
            tableContainerCount,
            `${route} expected at least one [data-slot="table-container"] — if this is 0, ` +
              "the Table markup changed and the selector above needs updating",
          ).toBeGreaterThan(0);
        }

        const badContainers = await findOverflowingContainers(page);
        expect(
          badContainers,
          `${route} @ ${width}px: found scroll container(s) whose content overflows ` +
            `materially without a reliable visible affordance:\n${JSON.stringify(badContainers, null, 2)}`,
        ).toEqual([]);

        const clippedCells = await findClippedProseCells(page);
        expect(
          clippedCells,
          `${route} @ ${width}px: found table cell(s) clipping prose via white-space: nowrap:\n${JSON.stringify(clippedCells, null, 2)}`,
        ).toEqual([]);
      });
    }
  }
});
