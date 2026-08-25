import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { story } from "../src/story";
import type { ChapterDefinition } from "../src/engine/types";

const HELP = `Export a human-readable manuscript from the story nodes.

Usage:
  npm run manuscript
  npm run manuscript -- --out manuscript.md
  npm run manuscript -- --format txt

Options:
  --out <file>      Output path (default: tmp/manuscript.md)
  --format md|txt   Output format (default: md)
  --help            Show this message.
`;

const args = process.argv.slice(2);
if (args.includes("--help")) {
  process.stdout.write(HELP);
  process.exit(0);
}

const outIndex = args.indexOf("--out");
const formatIndex = args.indexOf("--format");
const outArg = outIndex !== -1 ? args[outIndex + 1] : undefined;
const formatArg = formatIndex !== -1 ? args[formatIndex + 1] : undefined;

const format: "md" | "txt" =
  formatArg === "txt" ? "txt" : "md";

const defaultOut = `tmp/manuscript.${format}`;
const outPath = resolve(
  fileURLToPath(new URL("../", import.meta.url)),
  outArg ?? defaultOut,
);

const speakerMap = new Map<string, string>(
  story.speakers.map((s) => [s.id, s.name]),
);

const chapterMap = new Map<string, ChapterDefinition>(
  story.chapters.map((c) => [c.id, c]),
);

// Walk nodes in story order via the linked-list structure.
const nodeMap = new Map(story.nodes.map((n) => [n.id, n]));

function walkInOrder() {
  const visited = new Set<string>();
  const ordered = [];
  let currentId: string | null = story.startNodeId;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = nodeMap.get(currentId);
    if (!node) break;
    ordered.push(node);
    if (node.type === "line") {
      currentId = node.next;
    } else if (node.type === "choice") {
      // Emit all branches depth-first, then continue from the choice node itself.
      // For the manuscript we just list every branch option inline.
      currentId = null;
      for (const opt of node.choices) {
        if (!visited.has(opt.next)) {
          currentId = opt.next;
          break;
        }
      }
    } else {
      currentId = null;
    }
  }
  return ordered;
}

const ordered = walkInOrder();

const lines: string[] = [];
let currentChapterId: string | null = null;

for (const node of ordered) {
  if (node.chapterId !== currentChapterId) {
    currentChapterId = node.chapterId;
    const chapter = chapterMap.get(currentChapterId);
    const heading = chapter
      ? `${chapter.title}  [${chapter.period ?? ""}]`
      : currentChapterId;
    if (format === "md") {
      lines.push(`\n## ${heading}\n`);
    } else {
      lines.push(`\n${"=".repeat(60)}\n${heading}\n${"=".repeat(60)}\n`);
    }
  }

  if (node.type === "line") {
    if (node.speakerId === null) {
      // System/caption line
      if (format === "md") {
        lines.push(`> *${node.text}*\n`);
      } else {
        lines.push(`  [${node.text}]\n`);
      }
    } else {
      const name = speakerMap.get(node.speakerId) ?? node.speakerId;
      if (format === "md") {
        lines.push(`**${name}:** ${node.text}\n`);
      } else {
        lines.push(`${name.toUpperCase()}: ${node.text}\n`);
      }
    }
  } else if (node.type === "choice") {
    if (format === "md") {
      lines.push(`\n*[Choice: ${node.prompt}]*\n`);
      for (const opt of node.choices) {
        lines.push(`- ${opt.label}\n`);
      }
      lines.push("\n");
    } else {
      lines.push(`\n  CHOICE: ${node.prompt}\n`);
      for (const opt of node.choices) {
        lines.push(`    > ${opt.label}\n`);
      }
      lines.push("\n");
    }
  } else if (node.type === "end") {
    if (format === "md") {
      lines.push(`\n---\n**[End: ${node.title}]**\n`);
      if (node.text) lines.push(`\n${node.text}\n`);
    } else {
      lines.push(`\n[END: ${node.title}]\n`);
      if (node.text) lines.push(`${node.text}\n`);
    }
  }
}

const title =
  format === "md"
    ? `# ${story.title}: ${story.subtitle}\n\n*Story revision: ${story.revision}*\n`
    : `${story.title}: ${story.subtitle}\nStory revision: ${story.revision}\n`;

const output = title + lines.join("");

await writeFile(outPath, output, "utf8");
process.stdout.write(`Manuscript written to ${outPath}\n`);
