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
