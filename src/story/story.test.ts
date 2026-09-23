import { describe, expect, it } from "vitest";

import { artAssets } from "../art/manifest";
import { validateStory } from "../engine/validation";
import type { StoryNode } from "../engine/types";
import { story } from ".";
import { adulthoodStages } from "./adulthoodStages";
import { stages } from "./stages";
import { umrahStages } from "./umrahStages";

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

const lineText = (nodeId: string): string => {
  const node = story.nodes.find((candidate) => candidate.id === nodeId);
  expect(node?.type, nodeId).toBe("line");
  return node?.type === "line" ? node.text : "";
};

describe("production story", () => {
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
    expect(lineText("ns-discovery-join")).toMatch(
      /three facts remained:[\s\S]*USS[\s\S]*private story[\s\S]*Aisyah said she had history/i,
    );
    expect(lineText("ns-035")).toMatch(
      /I don't want to pretend I know the whole situation/i,
    );
    expect(lineText("ns-confrontation-join")).toMatch(
      /Nadiah acknowledged[\s\S]*first love[\s\S]*remained unresolved/i,
    );
    expect(lineText("ns-044")).toMatch(
      /did not give me the exact sentence[\s\S]*meaning I made/i,
    );
    expect(lineText("ns-038")).toMatch(
      /did not know why Nadiah was not wearing hijab[\s\S]*my immediate inference/i,
    );
  });

  it("frames Aleem's alarm as real without endorsing its prejudicial verdict", () => {
    expect(lineText("ns-050")).toMatch(/prejudice, not revelation/i);
    expect(lineText("uni-arrival-011")).toMatch(
      /revealed nothing about the women/i,
    );
    expect(lineText("uni-arrival-015")).toMatch(
      /none of those women had harmed me/i,
    );
    expect(lineText("uni-arrival-016")).toMatch(
      /alarm deserved attention[\s\S]*verdict did not deserve obedience/i,
    );
  });


  it("keeps reusable stages on manifest art and known speaker identities", () => {
    const knownAssetIds = new Set(artAssets.map((asset) => asset.id));
    const knownCharacterIds = new Set<string>(
      story.speakers.map((speaker) => speaker.id),
    );

    const reusableStages = [stages, adulthoodStages, umrahStages]
      .flatMap((collection) => Object.entries(collection));
    for (const [stageId, stage] of reusableStages) {
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
      (node) => node.id === "ns-036",
    )?.stage.overlay;
    expect(revealOverlay?.kind).toBe("social");
    expect(revealOverlay?.lines).toContain("Her reason is unknown.");

    const threatOverlay = story.nodes.find(
      (node) => node.id === "uni-arrival-009",
    )?.stage.overlay;
    expect(threatOverlay?.kind).toBe("intrusive");
    expect(threatOverlay?.label).toMatch(/subjective[\s\S]*not facts/i);
  });


  it("keeps the complete story and exactly twenty-five reflective choices", () => {
    const lineWords = story.nodes.reduce((total, node) => {
      if (node.type !== "line") {
        return total;
      }
      return total + (node.text.match(/[\p{L}\p{N}'’]+/gu)?.length ?? 0);
    }, 0);
    const choices = story.nodes.filter((node) => node.type === "choice");

    expect(story.nodes).toHaveLength(803);
    expect(story.chapters).toHaveLength(14);
    expect(story.speakers).toHaveLength(22);
    expect(lineWords).toBeGreaterThanOrEqual(24_000);
    expect(lineWords).toBeLessThanOrEqual(27_000);
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
      "ns-choice-discovery",
      "ns-choice-confrontation",
      "uni-arrival-choice-threat-scan",
      "ch6-choice-silence",
      "ch6-choice-question",
      "ch6-choice-farewell",
      "ch7-choice-rejection",
      "ch7-choice-companionship",
      "ch9-choice-sharing",
      "ch9-choice-sign",
      "ch10-choice-release",
      "ch10-choice-boundary",
      "ch11-choice-reciprocity",
      "ch11-choice-patience",
      "ch11-choice-openness",
    ]);
    expect(choices.every((node) => node.choices.length === 3)).toBe(true);
  });

  it("preserves every authored node, line, choice, and graph link during art refreshes", () => {
    expect(stableDigest(story.nodes.map(narrativeContract))).toBe("50f834b6");
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
      ["ns-choice-discovery", "ns-discovery-join"],
      ["ns-choice-confrontation", "ns-confrontation-join"],
      ["uni-arrival-choice-threat-scan", "uni-arrival-threat-scan-join"],
      ["ch6-choice-silence", "ch6-silence-join"],
      ["ch6-choice-question", "ch6-question-join"],
      ["ch6-choice-farewell", "ch6-farewell-join"],
      ["ch7-choice-rejection", "ch7-rejection-join"],
      ["ch7-choice-companionship", "ch7-companionship-join"],
      ["ch9-choice-sharing", "ch9-sharing-join"],
      ["ch9-choice-sign", "ch9-sign-join"],
      ["ch10-choice-release", "ch10-release-join"],
      ["ch10-choice-boundary", "ch10-boundary-join"],
      ["ch11-choice-reciprocity", "ch11-reciprocity-join"],
      ["ch11-choice-patience", "ch11-patience-join"],
      ["ch11-choice-openness", "ch11-openness-join"],
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

  it("takes every adulthood route through university, working life, arrival, and Umrah in order", () => {
    const nodeById = new Map(story.nodes.map((node) => [node.id, node]));
    expect(nodeById.get("ch5-038")).toMatchObject({ type: "line", next: "ns-001" });
    for (const [startId, nextMilestone] of [
      ["ns-001", "uni-arrival-001"],
      ["uni-arrival-001", "ch6-001"],
      ["ch6-001", "ch7-001"],
      ["ch7-001", "ch8-001"],
      ["ch8-001", "ch9-001"],
      ["ch9-001", "ch10-001"],
      ["ch10-001", "ch11-001"],
      ["ch11-001", "epilogue-001"],
      ["epilogue-001", "epilogue-end"],
    ] as const) {
      expect(everyRouteReaches(startId, nextMilestone, nodeById), startId).toBe(true);
    }
  });

  it.each([
    ["chapter-6", 2_600, 3_200],
    ["chapter-7", 1_800, 2_400],
    ["chapter-8", 450, 650],
    ["chapter-9", 2_200, 2_800],
    ["chapter-10", 1_600, 2_200],
    ["chapter-11", 3_100, 3_600],
    ["epilogue", 250, 400],
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

  it("keeps the pilgrimage lead-in short and carries the introduction into a full final chapter", () => {
    expect(story.nodes.filter((node) => node.type === "end").map((node) => node.id)).toEqual(["epilogue-end"]);
    const university = story.nodes.filter((node) => node.chapterId === "chapter-6");
    const workingLife = story.nodes.filter((node) => node.chapterId === "chapter-7");
    const journey = story.nodes.filter((node) => node.chapterId === "chapter-8");
    const epilogue = story.nodes.filter((node) => node.chapterId === "epilogue");
    const finale = story.nodes.filter((node) => node.chapterId === "chapter-11");
    expect(journey.length).toBeLessThan(university.length / 2);
    expect(journey.length).toBeLessThan(workingLife.length / 2);
    expect(journey.every((node) => node.type === "line")).toBe(true);
    expect(journey.at(-1)).toMatchObject({ type: "line", next: "ch9-001" });
    expect(finale[0]).toMatchObject({
      id: "ch11-001", type: "line", speakerId: "mariam", next: "ch11-002",
    });
    expect(lineText("ch11-001")).toContain("someone I work with");
    expect(finale[1]).toMatchObject({
      id: "ch11-002", type: "line", speakerId: "mariam",
      text: "Her name is Nurulain.", next: "ch11-003",
    });
    expect(epilogue.at(-1)).toMatchObject({
      id: "epilogue-end", type: "end", title: "The End",
      text: "The story ends here. Our journey continues. Inshallah, a happily ever after.",
    });
    expect(story.speakers.find((speaker) => speaker.id === "nurulain")).toMatchObject({ name: "Nurulain", shortName: "Nurul" });
    expect(finale.some((node) => node.type === "line" && node.speakerId === "nurulain")).toBe(true);
    const epilogueText = epilogue.filter((node) => node.type === "line").map((node) => node.text).join(" ");
    expect(epilogueText).toMatch(/engaged/i);
    expect(epilogueText).toMatch(/wedding/i);
    expect(epilogueText).not.toMatch(/on our wedding day|after our wedding|we were married/i);
  });

  it("keeps both climbs, their remembered significance, and the private Madinah prayer in order", () => {
    const nodeById = new Map(story.nodes.map((node) => [node.id, node]));
    for (const [startId, nextMilestone] of [
      ["ch9-001", "ch9-004"],
      ["ch9-004", "ch9-019"],
      ["ch9-019", "ch9-021"],
      ["ch9-021", "ch9-029"],
      ["ch9-029", "ch9-033"],
      ["ch9-033", "ch9-036"],
      ["ch9-036", "ch10-001"],
      ["ch10-001", "ch10-006"],
      ["ch10-006", "ch10-009"],
      ["ch10-009", "ch10-boundary-join"],
      ["ch10-boundary-join", "ch11-002"],
    ] as const) {
      expect(everyRouteReaches(startId, nextMilestone, nodeById), startId).toBe(true);
    }
    expect(lineText("ch9-005")).toMatch(/same girl from my National Service years/i);
    expect(lineText("ch9-007")).toContain("She wore a hijab");
    expect(lineText("ch9-019")).toMatch(/Jabal Nur[\s\S]*five of us/i);
    expect(lineText("ch9-021")).toMatch(/just Nadiah and me[\s\S]*hadn't manoeuvred/i);
    expect(lineText("ch9-029")).toContain("We remembered book-ins");
    expect(lineText("ch9-033")).toContain("again at Jabal Rahmah");
    expect(lineText("ch9-036")).toMatch(/tradition[\s\S]*Adam and Hawa[\s\S]*after coming down to earth/i);
    expect(lineText("ch9-037")).toContain("wondered whether this was a sign");
    expect(lineText("ch10-001")).toContain("Madinah came after Makkah");
    expect(lineText("ch10-003")).toContain("In Masjidil Nabawi, I found a moment alone");
    expect(lineText("ch10-006")).toMatch(/small doa about love[\s\S]*cannot give its exact words/i);
    expect(lineText("ch10-009")).toMatch(/unplanned sigh[\s\S]*something had come out with it/i);
    expect(nodeById.get("ch10-009")?.stage.backgroundId).toBe("cg-nabawi-release");
  });

  it("carries every final-chapter reflection through the remembered relationship milestones", () => {
    const nodeById = new Map(story.nodes.map((node) => [node.id, node]));
    const milestones = [
      "ch11-001", "ch11-004", "ch11-012", "ch11-014", "ch11-023",
      "ch11-choice-reciprocity", "ch11-030", "ch11-032", "ch11-035",
      "ch11-choice-patience", "ch11-036", "ch11-041", "ch11-042",
      "ch11-045", "ch11-055", "ch11-057", "ch11-059", "ch11-062",
      "ch11-choice-openness", "ch11-066", "ch11-068", "ch11-069",
      "epilogue-001", "epilogue-end",
    ];
    for (let index = 0; index < milestones.length - 1; index += 1) {
      const start = milestones[index]!;
      expect(everyRouteReaches(start, milestones[index + 1]!, nodeById), start).toBe(true);
    }

    expect(lineText("ch11-004")).toMatch(/I made the first move[\s\S]*His plans/);
    expect(nodeById.get("ch11-012")).toMatchObject({ speakerId: "nurulain" });
    expect(lineText("ch11-013")).toMatch(/She initiated our first meeting[\s\S]*Yakiniku/);
    expect(lineText("ch11-014")).toMatch(/beef to grill/);
    expect(lineText("ch11-023")).toMatch(/greet me[\s\S]*start a conversation[\s\S]*appreciate/);
    expect(lineText("ch11-030")).toBe("What's next?");
    expect(lineText("ch11-035")).toMatch(/after my trip to Kazakhstan/);
    expect(lineText("ch11-041")).toContain("Curiosity became the key.");
    expect(lineText("ch11-042")).toMatch(/friends travelling with me[\s\S]*happy for me[\s\S]*all the best/);
    expect(lineText("ch11-045")).toContain("We met at a restaurant.");
    expect(lineText("ch11-059")).toMatch(/following weekend[\s\S]*pier near the Kallang River[\s\S]*sunset/);
    expect(lineText("ch11-062")).toContain("telling her about my past");
    expect(lineText("ch11-063")).toContain("Masjidil Nabawi");
    expect(lineText("ch11-066")).toContain("pieces have been clicking together");
    expect(nodeById.get("ch11-068")).toMatchObject({ speakerId: "aleem-adult", text: "Nurul, I love you." });
    expect(nodeById.get("ch11-069")).toMatchObject({ speakerId: "nurulain", text: "I love you too, Aleem." });
    expect(nodeById.get("ch11-070")).toMatchObject({ next: "epilogue-001" });
  });

  it("grounds Nurul's early impressions in her later account and leaves room for her own pace", () => {
    expect(lineText("ch11-011")).toMatch(/Much later, Nurul told me[\s\S]*wondered whether I was a narcissist[\s\S]*first impression/);
    expect(lineText("ch11-028")).toMatch(/couldn't count our meetings[\s\S]*leave space[\s\S]*deserved patience/);
    expect(lineText("ch11-033")).toMatch(/I didn't know[\s\S]*intimidated[\s\S]*She told me later[\s\S]*room to choose/);
    expect(lineText("ch11-055")).toContain("at a pace we're both comfortable with");
    expect(lineText("ch11-057")).toMatch(/Nurul would later tell me[\s\S]*confidence[\s\S]*affection[\s\S]*sincerity/);
    expect(lineText("epilogue-002")).toContain("The wedding is still ahead of us.");
  });

  it("keeps Nadiah's longing an inference and Aleem's boundary a quiet personal decision", () => {
    expect(lineText("ch9-018")).toMatch(/how it felt to me[\s\S]*couldn't measure/i);
    expect(lineText("ch9-042")).toMatch(/thought I saw longing[\s\S]*could not name what she was thinking/i);
    expect(lineText("ch9-043")).toMatch(/my reading[\s\S]*no hidden piece of information/i);
    expect(lineText("ch10-018")).toMatch(/impression I formed, never a confession she gave me/i);
    expect(lineText("ch10-012")).toMatch(/old rule about Malay women[\s\S]*resentment[\s\S]*letting go/i);
    expect(lineText("ch10-020")).toMatch(/did not need to press her for a place she hadn't offered/i);
    expect(lineText("ch10-boundary-join")).toMatch(/no farewell conversation[\s\S]*stop seeking another moment alone[\s\S]*remain kind/i);
    expect(lineText("ch9-011")).toMatch(/Kak Mariam[\s\S]*Abang Yusuf/i);
    expect(lineText("ch9-014")).toContain("Their kindness");
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
      "2016–2018",
      "University–December 2021",
      "Working life · February 2023 onward",
      "January 2026",
      "Makkah · January 2026",
      "Madinah · January 2026",
      "After Umrah",
      "Engagement and wedding preparations",
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
