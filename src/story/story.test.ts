import { describe, expect, it } from "vitest";

import { artAssets } from "../art/manifest";
import { validateStory } from "../engine/validation";
import type { StoryNode } from "../engine/types";
import { story } from ".";
import { stages } from "./stages";

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

const lineWordCount = (nodes: readonly StoryNode[]): number =>
  nodes.reduce((total, node) => {
    if (node.type !== "line") {
      return total;
    }
    return total + (node.text.match(/[\p{L}\p{N}'’]+/gu)?.length ?? 0);
  }, 0);

const lineText = (nodeId: string): string => {
  const node = story.nodes.find((candidate) => candidate.id === nodeId);
  expect(node?.type, nodeId).toBe("line");
  return node?.type === "line" ? node.text : "";
};

describe("production story", () => {
  it("keeps the stable save ID while publishing the Before Nurul revision", () => {
    expect(story).toMatchObject({
      id: "return-to-me-school-years",
      title: "Return to Me",
      subtitle: "Before Nurul",
      revision: "before-nurul-3.0.0",
    });
  });

  it("keeps the Before Nurul release-sized script and exactly thirteen reflective choices", () => {
    const lineWords = lineWordCount(story.nodes);
    const choices = story.nodes.filter((node) => node.type === "choice");

    expect(story.nodes).toHaveLength(459);
    expect(lineWords).toBeGreaterThanOrEqual(11_000);
    expect(lineWords).toBeLessThanOrEqual(12_500);
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
      "ch6-choice-discovery",
      "ch6-choice-confrontation",
      "epilogue-choice-threat-scan",
    ]);
    expect(choices.every((node) => node.choices.length === 3)).toBe(true);
  });

  it("keeps Chapter 6 and The Doorway inside the approved manuscript budget", () => {
    const beforeNurulClosingNodes = story.nodes.filter(
      (node) => node.chapterId === "chapter-6" || node.chapterId === "epilogue",
    );
    const lineNodes = beforeNurulClosingNodes.filter(
      (node) => node.type === "line",
    );

    expect(lineWordCount(beforeNurulClosingNodes)).toBeGreaterThanOrEqual(2_400);
    expect(lineWordCount(beforeNurulClosingNodes)).toBeLessThanOrEqual(2_900);
    expect(lineNodes.length).toBeGreaterThanOrEqual(80);
    expect(lineNodes.length).toBeLessThanOrEqual(100);
  });

  it("preserves every authored node, line, choice, and graph link during art refreshes", () => {
    expect(stableDigest(story.nodes.map(narrativeContract))).toBe("37174f75");
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
      ["ch6-choice-discovery", "ch6-discovery-join"],
      ["ch6-choice-confrontation", "ch6-confrontation-join"],
      ["epilogue-choice-threat-scan", "epilogue-threat-scan-join"],
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

  it("keeps reusable stages on manifest art and known speaker identities", () => {
    const knownAssetIds = new Set(artAssets.map((asset) => asset.id));
    const knownCharacterIds = new Set<string>(
      story.speakers.map((speaker) => speaker.id),
    );

    for (const [stageId, stage] of Object.entries(stages)) {
      expect(knownAssetIds.has(stage.backgroundId), stageId).toBe(true);
      for (const sprite of stage.sprites) {
        expect(knownAssetIds.has(sprite.assetId), `${stageId}:${sprite.id}`).toBe(
          true,
        );
        expect(
          knownCharacterIds.has(sprite.characterId),
          `${stageId}:${sprite.id}:characterId`,
        ).toBe(true);
      }
    }
  });

  it("uses social and intrusive overlays only as bounded, labelled context", () => {
    const overlaidNodes = story.nodes.filter(
      (node) => node.stage.overlay !== undefined,
    );
    for (const node of overlaidNodes) {
      expect(node.stage.overlay?.label.trim(), node.id).not.toBe("");
      expect(node.stage.overlay?.lines.length, node.id).toBeGreaterThan(0);
    }

    const revealOverlay = story.nodes.find(
      (node) => node.id === "ch6-036",
    )?.stage.overlay;
    expect(revealOverlay?.kind).toBe("social");
    expect(revealOverlay?.lines).toContain("Her reason is unknown.");

    const threatOverlay = story.nodes.find(
      (node) => node.id === "epilogue-009",
    )?.stage.overlay;
    expect(threatOverlay?.kind).toBe("intrusive");
    expect(threatOverlay?.label).toMatch(/subjective[\s\S]*not facts/i);
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

  it("defines all eight chapters and the 2009–2018 timeline", () => {
    expect(
      story.chapters.map(({ id, title, period, startNodeId }) => ({
        id,
        title,
        period,
        startNodeId,
      })),
    ).toEqual([
      {
        id: "prologue",
        title: "Before Nurul",
        period: "Years later",
        startNodeId: "prologue-001",
      },
      {
        id: "chapter-1",
        title: "The Wrong Message",
        period: "2009–2010",
        startNodeId: "ch1-001",
      },
      {
        id: "chapter-2",
        title: "A Different Classroom",
        period: "2011–2013",
        startNodeId: "ch2-001",
      },
      {
        id: "chapter-3",
        title: "The Bus We Waited For",
        period: "2014",
        startNodeId: "ch3-001",
      },
      {
        id: "chapter-4",
        title: "Looking for an Answer",
        period: "2014–2015",
        startNodeId: "ch4-001",
      },
      {
        id: "chapter-5",
        title: "The Zoo After Results",
        period: "2016",
        startNodeId: "ch5-001",
      },
      {
        id: "chapter-6",
        title: "The Story I Wasn’t In",
        period: "2016–2018",
        startNodeId: "ch6-001",
      },
      {
        id: "epilogue",
        title: "The Doorway",
        period: "First week of university, 2018",
        startNodeId: "epilogue-001",
      },
    ]);
  });

  it("retains the dated National Service, POP, ORD, and university milestones", () => {
    const script = story.nodes
      .filter((node) => node.type === "line")
      .map((node) => node.text)
      .join(" ");
    expect(script).toMatch(/\bMinecraft\b/);
    expect(script).toMatch(/\bO(?:-| )Levels?\b/);
    expect(script).toMatch(/\bA(?:-| )Levels?\b/);
    expect(script).toMatch(/\bzoo\b/i);
    expect(script).toMatch(/\bNational Service\b/);
    expect(script).toMatch(/\bPassing Out Parade\b/);
    expect(script).toMatch(/\bOperationally Ready Date\b/);
    expect(script).toMatch(/University began in 2018/);
    expect(script).toMatch(/\bUniversal Studios Singapore\b/);
    expect(script).toMatch(/\bInstagram\b/);
    expect(script).toMatch(/\bNurul\b/);
  });

  it("keeps observed, reported, acknowledged, and inferred claims distinct", () => {
    expect(lineText("ch6-discovery-join")).toMatch(
      /three facts remained:[\s\S]*USS[\s\S]*private story[\s\S]*Aisyah said she had history/i,
    );
    expect(lineText("ch6-035")).toMatch(
      /I don't want to pretend I know the whole situation/i,
    );
    expect(lineText("ch6-confrontation-join")).toMatch(
      /Nadiah acknowledged[\s\S]*first love[\s\S]*remained unresolved/i,
    );
    expect(lineText("ch6-044")).toMatch(
      /did not give me the exact sentence[\s\S]*meaning I made/i,
    );
    expect(lineText("ch6-038")).toMatch(
      /did not know why Nadiah was not wearing hijab[\s\S]*my immediate inference/i,
    );
  });

  it("frames Aleem's alarm as real without endorsing its prejudicial verdict", () => {
    expect(lineText("ch6-050")).toMatch(/prejudice, not revelation/i);
    expect(lineText("epilogue-011")).toMatch(
      /revealed nothing about the women/i,
    );
    expect(lineText("epilogue-015")).toMatch(
      /none of those women had harmed me/i,
    );
    expect(lineText("epilogue-016")).toMatch(
      /alarm deserved attention[\s\S]*verdict did not deserve obedience/i,
    );
  });

  it("ends on young Aleem's exact question and The Doorway card", () => {
    const spokenLines = story.nodes.filter((node) => node.type === "line");
    const finalLine = spokenLines.at(-1);
    const endingNode = story.nodes.at(-1);

    expect(finalLine).toMatchObject({
      id: "epilogue-017",
      type: "line",
      speakerId: "aleem-young-adult",
      text: "What was that?",
      next: "epilogue-end",
    });
    expect(endingNode).toMatchObject({
      id: "epilogue-end",
      type: "end",
      title: "The Doorway",
      text: "University had barely begun.",
    });
  });
});
