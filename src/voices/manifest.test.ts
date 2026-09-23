import { describe, expect, it } from "vitest";

import { artAssets as assetEntries } from "../art/manifest";
import { validateStory } from "../engine/validation";
import { story } from "../story";
import {
  offlinePackManifests,
  productionVoiceManifest,
  voiceEntries,
  voiceProfiles,
} from ".";

describe("production content manifests", () => {
  it("validates the text-only development manifest", () => {
    expect(
      validateStory(story, {
        assets: assetEntries,
        voices: voiceEntries,
        offlinePacks: offlinePackManifests,
      }),
    ).toEqual([]);
  });

  it("defines one provider-neutral profile per spoken character", () => {
    const spokenSpeakers = new Set(
      story.nodes.flatMap((node) =>
        node.type === "line" && node.speakerId !== null ? [node.speakerId] : [],
      ),
    );
    expect(new Set(voiceProfiles.map((profile) => profile.speakerId))).toEqual(
      spokenSpeakers,
    );
    expect(productionVoiceManifest.contentRevision).toBe(story.revision);
  });

  it("keeps the expanded cast provider-neutral and production audio empty", () => {
    expect(voiceProfiles.map((profile) => profile.id)).toEqual([
      "adult-aleem",
      "young-aleem",
      "teen-aleem",
      "alya",
      "hana",
      "faris",
      "mutual-friend",
      "syafiqa",
      "mei-lin",
      "aleem-adult",
      "jia-wen",
      "claire",
      "imran",
      "young-adult-aleem",
      "nadiah",
      "aisyah",
      "hakim",
      "mariam",
      "yusuf",
      "nurulain",
      "nurul-mother",
      "nurul-father",
    ]);
    expect(voiceEntries).toHaveLength(0);
    expect(offlinePackManifests).toHaveLength(0);
  });

  it("makes missing production voices fail strict validation", () => {
    const issues = validateStory(story, {
      assets: assetEntries,
      voices: voiceEntries,
      offlinePacks: offlinePackManifests,
      requireVoiceCoverage: true,
    });
    expect(
      issues.some((issue) => issue.code === "incomplete-voice-coverage"),
    ).toBe(true);
  });
});
