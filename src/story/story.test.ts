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

const narrativeContract = (node: StoryNode): object => {
  if (node.type === "line") {
    return {
      id: node.id,
      chapterId: node.chapterId,
      type: node.type,
      speakerId: node.speakerId,
      text: node.text,
      next: node.next,
    };
  }
  if (node.type === "choice") {
    return {
      id: node.id,
      chapterId: node.chapterId,
      type: node.type,
      prompt: node.prompt,
      choices: node.choices,
    };
  }
  return {
    id: node.id,
    chapterId: node.chapterId,
    type: node.type,
    title: node.title,
    text: node.text,
  };
};

const completeStageKey = (node: StoryNode): string => JSON.stringify(node.stage);

const stableDigest = (value: unknown): string => {
  let hash = 0x811c9dc5;
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};

describe("production story", () => {
  it("keeps the expanded release-sized script and exactly ten reflective choices", () => {
    const lineWords = story.nodes.reduce((total, node) => {
      if (node.type !== "line") {
        return total;
      }
      return total + (node.text.match(/[\p{L}\p{N}'’]+/gu)?.length ?? 0);
    }, 0);
    const choices = story.nodes.filter((node) => node.type === "choice");

    expect(story.nodes).toHaveLength(371);
    expect(lineWords).toBeGreaterThanOrEqual(8_500);
    expect(lineWords).toBeLessThanOrEqual(10_000);
    expect(choices.map((node) => node.id)).toEqual([
      "ch1-choice-sms",
      "ch2-choice-wingman",
      "ch2-choice-priority",
      "ch2-choice-friend",
      "ch2-choice-results",
      "ch3-choice-bus",
      "ch3-choice-confession",
      "ch3-choice-belief",
      "ch4-choice-search",
      "ch5-choice-zoo",
    ]);
    expect(choices.every((node) => node.choices.length === 3)).toBe(true);
  });

  it("preserves every authored node, line, choice, and graph link during art refreshes", () => {
    expect(stableDigest(story.nodes.map(narrativeContract))).toBe("2e37e936");
  });

  it("reconverges every choice before the next milestone", () => {
    const nodeById = new Map(story.nodes.map((node) => [node.id, node]));
    const expectedJoins = new Map([
      ["ch1-choice-sms", "ch1-035"],
      ["ch2-choice-wingman", "ch2-025"],
      ["ch2-choice-priority", "ch2-048"],
      ["ch2-choice-friend", "ch2-078"],
      ["ch2-choice-results", "ch2-101"],
      ["ch3-choice-bus", "ch3-bus-join"],
      ["ch3-choice-confession", "ch3-confession-join"],
      ["ch3-choice-belief", "ch3-belief-join"],
      ["ch4-choice-search", "ch4-search-join"],
      ["ch5-choice-zoo", "ch5-zoo-join"],
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

  it("keeps every stage complete and limits identical Chapter 1-2 shots to three nodes", () => {
    for (const node of story.nodes) {
      expect(node.stage.backgroundId, node.id).not.toBe("");
      expect(Array.isArray(node.stage.sprites), node.id).toBe(true);
      expect(node.stage.mood.trim(), node.id).not.toBe("");
      expect(node.stage.transition, node.id).toMatch(
        /^(none|cut|fade|dissolve|slide)$/,
      );
    }

    const nodeById = new Map(story.nodes.map((node) => [node.id, node]));
    const violations: string[] = [];
    const visit = (
      nodeId: string,
      previousStage: string | undefined,
      repeatCount: number,
      route: readonly string[],
    ): void => {
      if (nodeId === "ch3-001") {
        return;
      }
      const node = nodeById.get(nodeId);
      if (node === undefined) {
        return;
      }

      const stage = completeStageKey(node);
      const nextRepeatCount = stage === previousStage ? repeatCount + 1 : 1;
      const nextRoute = [...route, node.id];
      if (nextRepeatCount > 3) {
        violations.push(nextRoute.slice(-4).join(" -> "));
        return;
      }

      for (const next of nextIds(node)) {
        visit(next, stage, nextRepeatCount, nextRoute);
      }
    };

    visit("ch1-001", undefined, 0, []);
    expect(violations).toEqual([]);
  });

  it("retains the true-life dates and key Minecraft milestone", () => {
    expect(story.chapters.map((chapter) => chapter.period)).toEqual([
      "Years later",
      "2009–2010",
      "2011–2013",
      "2014",
      "2014–2015",
      "2016",
      "After 2016",
    ]);
    const script = story.nodes
      .filter((node) => node.type === "line")
      .map((node) => node.text)
      .join(" ");
    expect(script).toMatch(/\bMinecraft\b/);
    expect(script).toMatch(/\bO-Level\b/);
    expect(script).toMatch(/\bA-Level\b/);
    expect(script).toMatch(/\bzoo\b/i);
    expect(script).toMatch(/\bNurul\b/);
  });
});
