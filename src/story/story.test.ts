import { describe, expect, it } from "vitest";

import { artAssets } from "../art/manifest";
import { validateStory } from "../engine/validation";
import type { StoryNode } from "../engine/types";
import { story } from ".";

const nextIds = (node: StoryNode): readonly string[] => {
  if (node.type === "line") {
    return [node.next];
  }
  if (node.type === "choice") {
    return node.choices.map((option) => option.next);
  }
  return [];
};

const reaches = (
  startId: string,
  targetId: string,
  nodeById: ReadonlyMap<string, StoryNode>,
): boolean => {
  const pending = [startId];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const currentId = pending.pop();
    if (currentId === undefined || visited.has(currentId)) {
      continue;
    }
    if (currentId === targetId) {
      return true;
    }
    visited.add(currentId);
    const current = nodeById.get(currentId);
    if (current !== undefined) {
      pending.push(...nextIds(current));
    }
  }
  return false;
};

describe("production story", () => {
  it("keeps the release-sized script and exactly five reflective choices", () => {
    const lineWords = story.nodes.reduce((total, node) => {
      if (node.type !== "line") {
        return total;
      }
      return total + (node.text.match(/[\p{L}\p{N}'’]+/gu)?.length ?? 0);
    }, 0);
    const choices = story.nodes.filter((node) => node.type === "choice");

    expect(lineWords).toBeGreaterThanOrEqual(4_500);
    expect(lineWords).toBeLessThanOrEqual(5_500);
    expect(choices.map((node) => node.id)).toEqual([
      "ch1-choice-sms",
      "ch2-choice-wingman",
      "ch2-choice-priority",
      "ch2-choice-friend",
      "ch2-choice-results",
    ]);
  });

  it("reconverges every choice before the next milestone", () => {
    const nodeById = new Map(story.nodes.map((node) => [node.id, node]));
    const expectedJoins = new Map([
      ["ch1-choice-sms", "ch1-035"],
      ["ch2-choice-wingman", "ch2-025"],
      ["ch2-choice-priority", "ch2-048"],
      ["ch2-choice-friend", "ch2-078"],
      ["ch2-choice-results", "ch2-101"],
    ]);

    for (const [choiceId, joinId] of expectedJoins) {
      const choice = nodeById.get(choiceId);
      expect(choice?.type, choiceId).toBe("choice");
      if (choice?.type !== "choice") {
        continue;
      }
      for (const option of choice.choices) {
        expect(reaches(option.next, joinId, nodeById), option.id).toBe(true);
      }
    }
  });

  it("passes the complete graph, stage, speaker, and asset audit", () => {
    expect(validateStory(story, { assets: artAssets })).toEqual([]);
  });

  it("retains the true-life dates and key Minecraft milestone", () => {
    expect(story.chapters.map((chapter) => chapter.period)).toEqual([
      "Years later",
      "2009–2010",
      "2011–2013",
      "After 2013",
    ]);
    const script = story.nodes
      .filter((node) => node.type === "line")
      .map((node) => node.text)
      .join(" ");
    expect(script).toMatch(/\bMinecraft\b/);
    expect(script).toMatch(/\bO-Level\b/);
    expect(script).toMatch(/\bNurul\b/);
  });
});