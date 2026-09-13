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

const everyRouteReaches = (
  startId: string,
  targetId: string,
  nodeById: ReadonlyMap<string, StoryNode>,
): boolean => {
  const visiting = new Set<string>();
  const checked = new Map<string, boolean>();
  const visit = (id: string): boolean => {
    if (id === targetId) return true;
    if (visiting.has(id)) return false;
    const known = checked.get(id);
    if (known !== undefined) return known;
    const node = nodeById.get(id);
    if (node === undefined || node.type === "end") return false;
    visiting.add(id);
    const result = nextIds(node).every(visit);
    visiting.delete(id);
    checked.set(id, result);
    return result;
  };
  return visit(startId);
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
  it("keeps the expanded release-sized script and exactly fifteen reflective choices", () => {
    const lineWords = story.nodes.reduce((total, node) => {
      if (node.type !== "line") {
        return total;
      }
      return total + (node.text.match(/[\p{L}\p{N}'’]+/gu)?.length ?? 0);
    }, 0);
    const choices = story.nodes.filter((node) => node.type === "choice");

    expect(story.nodes).toHaveLength(502);
    expect(lineWords).toBeGreaterThanOrEqual(14_000);
    expect(lineWords).toBeLessThanOrEqual(15_000);
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
      "ch6-choice-silence",
      "ch6-choice-question",
      "ch6-choice-farewell",
      "ch7-choice-rejection",
      "ch7-choice-companionship",
    ]);
    expect(choices.every((node) => node.choices.length === 3)).toBe(true);
  });

  it("preserves every authored node, line, choice, and graph link during art refreshes", () => {
    expect(stableDigest(story.nodes.map(narrativeContract))).toBe("4cb64106");
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
      ["ch6-choice-silence", "ch6-silence-join"],
      ["ch6-choice-question", "ch6-question-join"],
      ["ch6-choice-farewell", "ch6-farewell-join"],
      ["ch7-choice-rejection", "ch7-rejection-join"],
      ["ch7-choice-companionship", "ch7-companionship-join"],
    ]);

    for (const [choiceId, joinId] of expectedJoins) {
      const choice = nodeById.get(choiceId);
      expect(choice?.type, choiceId).toBe("choice");
      if (choice?.type !== "choice") {
        continue;
      }
      for (const option of choice.choices) {
        expect(everyRouteReaches(option.next, joinId, nodeById), option.id).toBe(true);
      }
    }
  });

  it("passes the complete graph, stage, speaker, and asset audit", () => {
    expect(validateStory(story, { assets: artAssets })).toEqual([]);
  });

  it("takes every adulthood route through university, working life, and arrival in order", () => {
    const nodeById = new Map(story.nodes.map((node) => [node.id, node]));
    expect(nodeById.get("ch5-038")).toMatchObject({ type: "line", next: "ch6-001" });
    for (const [startId, nextMilestone] of [
      ["ch6-001", "ch7-001"],
      ["ch7-001", "ch8-001"],
      ["ch8-001", "epilogue-001"],
      ["epilogue-001", "epilogue-end"],
    ] as const) {
      expect(everyRouteReaches(startId, nextMilestone, nodeById), startId).toBe(true);
    }
  });

  it.each([
    ["chapter-6", 2_600, 3_200],
    ["chapter-7", 1_800, 2_400],
    ["chapter-8", 450, 650],
  ] as const)("keeps every readable %s route within its word budget", (chapterId, minimum, maximum) => {
    const chapter = story.chapters.find((entry) => entry.id === chapterId);
    const nodeById = new Map<string, StoryNode>(story.nodes.map((node) => [node.id, node]));
    const countWords = (node: StoryNode): number =>
      node.type === "line" ? (node.text.match(/[\p{L}\p{N}'’]+/gu)?.length ?? 0) : 0;
    const routeWords = (nodeId: string, select: (...counts: number[]) => number): number => {
      const node = nodeById.get(nodeId);
      if (node === undefined || node.chapterId !== chapterId || node.type === "end") return 0;
      return countWords(node) + select(...nextIds(node).map((id) => routeWords(id, select)));
    };

    expect(chapter).toBeDefined();
    if (chapter === undefined) return;
    expect(routeWords(chapter.startNodeId, Math.min)).toBeGreaterThanOrEqual(minimum);
    expect(routeWords(chapter.startNodeId, Math.max)).toBeLessThanOrEqual(maximum);
    // The complete authored chapter also includes the unselected reflections.
    const authoredWords = story.nodes
      .filter((node) => node.chapterId === chapterId)
      .reduce((total, node) => total + countWords(node), 0);
    expect(authoredWords).toBeLessThanOrEqual(maximum);
  });

  it("places the two confessions and January journey at their remembered milestones", () => {
    const nodeById = new Map<string, StoryNode>(story.nodes.map((node) => [node.id, node]));
    const lineText = (nodeId: string): string => {
      const node = nodeById.get(nodeId);
      expect(node?.type, nodeId).toBe("line");
      return node?.type === "line" ? node.text : "";
    };
    expect(lineText("ch6-001")).toContain("second year");
    expect(lineText("ch6-029")).toContain("fourth year");
    expect(lineText("ch6-030")).toContain("December 2021");
    expect(everyRouteReaches("ch6-033", "ch6-035", nodeById)).toBe(true);
    expect(everyRouteReaches("ch6-035", "ch6-043", nodeById)).toBe(true);
    expect(nodeById.get("ch6-045")).toMatchObject({ speakerId: "jia-wen", text: "Why didn’t you tell me earlier?" });
    expect(lineText("ch7-002")).toContain("six months before me");
    expect(lineText("ch7-014")).toContain("Valentine's Day in 2023");
    expect(lineText("ch7-015")).toContain("On 14 February");
    expect(lineText("ch8-002")).toContain("January 2026");
    expect(lineText("ch8-006")).toContain("Makkah and Madinah");
    expect(lineText("ch8-012")).toContain("arrived in the holy land");
  });

  it("keeps the pilgrimage lead-in short and ends on the arrival scene", () => {
    const university = story.nodes.filter((node) => node.chapterId === "chapter-6");
    const workingLife = story.nodes.filter((node) => node.chapterId === "chapter-7");
    const journey = story.nodes.filter((node) => node.chapterId === "chapter-8");
    const epilogue = story.nodes.filter((node) => node.chapterId === "epilogue");
    expect(journey.length).toBeLessThan(university.length / 2);
    expect(journey.length).toBeLessThan(workingLife.length / 2);
    expect(journey.every((node) => node.type === "line")).toBe(true);
    expect(journey.at(-1)).toMatchObject({ type: "line", next: "epilogue-001" });
    expect(epilogue).toHaveLength(3);
    expect(epilogue.every((node) => node.stage.backgroundId === journey.at(-1)?.stage.backgroundId)).toBe(true);
    expect(epilogue.at(-1)).toMatchObject({ id: "epilogue-end", type: "end" });
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
      "University–December 2021",
      "Working life · February 2023 onward",
      "January 2026",
      "January 2026",
    ]);
    const script = story.nodes
      .filter((node) => node.type === "line")
      .map((node) => node.text)
      .join(" ");
    expect(script).toMatch(/\bMinecraft\b/);
    expect(script).toMatch(/\bO[ -]Levels?\b/);
    expect(script).toMatch(/\bA[ -]Levels?\b/);
    expect(script).toMatch(/\bzoo\b/i);
    expect(script).toMatch(/\bNurul\b/);
    expect(script).toMatch(/Universal Studios Singapore/);
    expect(script).toMatch(/December 2021/);
    expect(script).toMatch(/2023/);
    expect(script).toMatch(/January 2026/);
    expect(script).toContain("Why didn’t you tell me earlier?");
  });
});
