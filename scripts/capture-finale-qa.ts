/**
 * Capture the actual production app, with the same Chromium/save-fixture flow
 * as e2e/story.spec.ts. Start a preview server before running:
 *   npx tsx scripts/capture-finale-qa.ts [http://127.0.0.1:4173/return-to-me-test/]
 * This script never builds the app, starts a server, or changes story content.
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, expect, type Page } from "@playwright/test";
import {
  parseSave,
  SAVE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from "../src/engine/persistence";
import { DEFAULT_SETTINGS, type SaveV1 } from "../src/engine/types";
import { story } from "../src/story";

const appUrl = new URL(process.argv[2] ?? "http://127.0.0.1:4173/return-to-me-test/");
assert.ok(
  ["http:", "https:"].includes(appUrl.protocol)
    && ["127.0.0.1", "localhost", "[::1]"].includes(appUrl.hostname),
  "Finale QA must target a local preview server.",
);
const outputDirectory = resolve(import.meta.dirname, "../art/qa/finale/screenshots");

const views = [
  { label: "desktop", width: 1440, height: 900, mobile: false },
  { label: "mobile", width: 390, height: 664, mobile: true },
] as const;
const scenes = [
  { label: "01-chapter-introduction", nodeId: "ch11-001" },
  { label: "02-first-yakiniku", nodeId: "ch11-014" },
  { label: "03-reflective-choice", nodeId: "ch11-choice-reciprocity" },
  { label: "04-parents-dinner", nodeId: "ch11-046" },
  { label: "05-sunset-confession", nodeId: "ch11-069" },
  { label: "06-wedding-planning", nodeId: "epilogue-001" },
  { label: "07-final-ending", nodeId: "epilogue-end" },
] as const;

type ImageResult = {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
};
type CaptureResult = {
  view: string;
  nodeId: string;
  screenshot: string;
  status: "passed" | "failed";
  images?: ImageResult[];
  choiceOptionsVisible?: number;
  horizontalOverflow?: number;
  error?: string;
};

async function assertInsideViewport(page: Page, label: string, element: ReturnType<Page["locator"]>) {
  await expect(element, label).toBeVisible();
  const bounds = await element.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(bounds !== null && viewport !== null, `${label}: missing geometry`);
  assert.ok(bounds.x >= -1 && bounds.y >= -1, `${label}: starts outside viewport`);
  assert.ok(bounds.x + bounds.width <= viewport.width + 1, `${label}: horizontal clipping`);
  assert.ok(bounds.y + bounds.height <= viewport.height + 1, `${label}: vertical clipping`);
}

await mkdir(outputDirectory, { recursive: true });
const results: CaptureResult[] = [];
const browser = await chromium.launch();

try {
  for (const view of views) {
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: 1,
      isMobile: view.mobile,
      hasTouch: view.mobile,
      reducedMotion: "reduce",
      colorScheme: "dark",
    });
    try {
      for (const scene of scenes) {
        const node = story.nodes.find((candidate) => candidate.id === scene.nodeId);
        assert.ok(node !== undefined, `Missing screenshot node: ${scene.nodeId}`);
        const save: SaveV1 = {
          version: 1,
          storyId: story.id,
          storyRevision: story.revision,
          currentNodeId: node.id,
          status: node.type === "end" ? "ended" : "playing",
          history: [],
          rememberedChoices: {},
          unlockedChapters: story.chapters.map((chapter) => chapter.id),
          seenNodeIds: [],
          timestamp: 0,
        };
        const rawSave = JSON.stringify(save);
        assert.equal(parseSave(rawSave, story).status, "ok", `Invalid fixture: ${node.id}`);
        const page = await context.newPage();
        page.setDefaultTimeout(15_000);
        page.setDefaultNavigationTimeout(30_000);
        const filename = `${view.label}-${scene.label}.png`;
        const result: CaptureResult = {
          view: view.label,
          nodeId: node.id,
          screenshot: filename,
          status: "failed",
        };
        try {
          await page.addInitScript(({ saveKey, settingsKey, saved, settings, origin }) => {
            if (location.origin !== origin) return;
            localStorage.setItem(saveKey, saved);
            localStorage.setItem(settingsKey, JSON.stringify(settings));
          }, {
            saveKey: SAVE_STORAGE_KEY,
            settingsKey: SETTINGS_STORAGE_KEY,
            saved: rawSave,
            settings: {
              ...DEFAULT_SETTINGS,
              textSpeedMs: 0,
              autoMode: false,
              skipSeen: false,
              muted: true,
              reducedMotion: true,
            },
            origin: appUrl.origin,
          });
          const response = await page.goto(appUrl.href, { waitUntil: "domcontentloaded" });
          assert.ok(response?.ok(), `Preview returned ${response?.status() ?? "no response"}`);
          const notice = page.getByRole("dialog", { name: "A note before we begin" });
          await expect(notice).toBeVisible();
          await notice.getByRole("button", { name: "Continue to title" }).click();
          await page.getByRole("button", { name: "Continue", exact: true }).click();

          const stage = page.locator("figure[aria-label^='Scene:']");
          await expect(stage).toHaveAttribute("aria-label", `Scene: ${node.stage.mood}`);
          if (node.type === "end") {
            await assertInsideViewport(page, "Final title", page.getByRole("heading", { name: "The End", exact: true }));
            await assertInsideViewport(page, "Final text", page.getByText(node.text!, { exact: true }));
            await assertInsideViewport(page, "Return to title", page.getByRole("button", { name: "Return to title", exact: true }));
          } else if (node.type === "choice") {
            const choice = page.getByRole("region", { name: "Choice", exact: true });
            await expect(choice).toContainText(node.prompt);
            assert.equal(node.choices.length, 3, "QA choice must contain three options");
            for (const option of node.choices) {
              await assertInsideViewport(page, option.label, choice.getByRole("button", { name: option.label, exact: true }));
            }
            result.choiceOptionsVisible = node.choices.length;
          } else {
            const dialogue = page.getByRole("region", { name: "Dialogue", exact: true });
            await expect(dialogue).toContainText(node.text);
            await expect(page.getByRole("button", { name: "Advance dialogue", exact: true })).toBeVisible();
          }

          await page.evaluate(async () => { await document.fonts.ready; });
          result.images = await stage.locator("img").evaluateAll(async (elements) => {
            return await Promise.all(elements.map(async (element) => {
              const image = element as HTMLImageElement;
              await image.decode();
              if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
                throw new Error(`Image did not decode: ${image.currentSrc}`);
              }
              return {
                src: new URL(image.currentSrc).pathname,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
              };
            }));
          });
          const isCg = node.stage.backgroundId.startsWith("cg-");
          assert.equal(result.images.length, 1 + node.stage.sprites.length + Number(isCg), "Missing stage images");
          assert.ok(result.images[0]?.src.endsWith(`/${node.stage.backgroundId}.webp`), "Incorrect stage background");
          if (view.mobile && isCg && node.type !== "end") {
            const composition = page.getByTestId("cg-composition");
            await assertInsideViewport(page, "Full CG composition", composition);
            await expect(composition).toHaveCSS("object-fit", "contain");
            const picture = await composition.boundingBox();
            const dialogue = await page.getByRole("region", { name: "Dialogue", exact: true }).boundingBox();
            assert.ok(picture !== null && dialogue !== null);
            assert.ok(Math.abs(picture.width / picture.height - 16 / 9) < 0.01, "CG aspect ratio changed");
            assert.ok(picture.y + picture.height <= dialogue.y + 1, "Dialogue overlaps full CG composition");
          }
          result.horizontalOverflow = await page.evaluate(() => Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          ) - window.innerWidth);
          assert.ok(result.horizontalOverflow <= 1, `${view.label}: horizontal overflow`);
          await page.screenshot({ path: resolve(outputDirectory, filename), fullPage: false, animations: "disabled", caret: "hide" });
          result.status = "passed";
          console.log(`Captured ${view.label}: ${node.id}`);
        } catch (error) {
          result.error = error instanceof Error ? error.message : String(error);
          await page.screenshot({ path: resolve(outputDirectory, filename), fullPage: false, animations: "disabled", caret: "hide" }).catch(() => undefined);
          console.error(`Failed ${view.label}: ${node.id}: ${result.error}`);
        } finally {
          results.push(result);
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(resolve(outputDirectory, "report.json"), `${JSON.stringify({
    capturedAt: new Date().toISOString(),
    url: appUrl.href,
    storyRevision: story.revision,
    browser: "chromium",
    views,
    results,
    passed: results.length === views.length * scenes.length && results.every((result) => result.status === "passed"),
  }, null, 2)}\n`, "utf8");
}

if (results.some((result) => result.status === "failed")) {
  process.exitCode = 1;
} else {
  console.log(`Finale QA passed: ${results.length} screenshots in ${outputDirectory}`);
}
