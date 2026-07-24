import type {
  OfflinePackManifest,
  SpeakerId,
  StoryId,
  StoryRevision,
  VoiceEntry,
} from "../engine/types";
import { STORY_REVISION } from "../story";
import {
  generatedOfflinePackManifests,
  generatedVoiceDisclosure,
  generatedVoiceEntries,
} from "./generated";

export interface VoiceProfile {
  /** Provider-neutral profile ID referenced by VoiceEntry.provenance.profile. */
  readonly id: string;
  readonly speakerId: SpeakerId;
  readonly displayName: string;
  readonly direction: string;
  readonly synthetic: true;
}

export interface ProductionAudioSpecification {
  readonly container: "mp3";
  readonly sampleRateHz: 48_000;
  readonly targetBitrateKbps: 96;
  readonly channels: 1;
  readonly targetLufs: -16;
  readonly maxPeakDb: -1;
}

export interface ProductionVoiceManifest {
  readonly schemaVersion: 1;
  readonly storyId: StoryId;
  readonly contentRevision: StoryRevision;
  readonly disclosure: string;
  readonly audio: ProductionAudioSpecification;
  readonly profiles: readonly VoiceProfile[];
  readonly entries: readonly VoiceEntry[];
  readonly offlinePacks: readonly OfflinePackManifest[];
}

export const voiceProfiles = [
  {
    id: "adult-aleem",
    speakerId: "adult-aleem",
    displayName: "Adult Aleem",
    direction: "Warm, reflective adult narrator; calm Singaporean English.",
    synthetic: true,
  },
  {
    id: "young-aleem",
    speakerId: "aleem-p6",
    displayName: "Primary 6 Aleem",
    direction: "Age-appropriate youthful voice; earnest and slightly shy.",
    synthetic: true,
  },
  {
    id: "teen-aleem",
    speakerId: "aleem-sec",
    displayName: "Teenage Aleem",
    direction: "Teenage voice; thoughtful, reserved, and increasingly tired.",
    synthetic: true,
  },
  {
    id: "alya",
    speakerId: "alya",
    displayName: "Alya",
    direction: "Age-appropriate youthful voice; bright, then sincerely apologetic.",
    synthetic: true,
  },
  {
    id: "hana",
    speakerId: "hana",
    displayName: "Hana",
    direction: "Age-appropriate teenage voice; composed, warm, and direct.",
    synthetic: true,
  },
  {
    id: "faris",
    speakerId: "faris",
    displayName: "Faris",
    direction: "Friendly teenage voice; confident comic warmth without caricature.",
    synthetic: true,
  },
  {
    id: "mutual-friend",
    speakerId: "mutual-friend",
    displayName: "Mutual Friend",
    direction: "Brief, neutral teenage voice delivering difficult news gently.",
    synthetic: true,
  },
] as const satisfies readonly VoiceProfile[];

/**
 * Development intentionally remains playable without audio. The generated
 * module stays empty until a complete licensed production set is imported.
 */
export const voiceEntries: readonly VoiceEntry[] = generatedVoiceEntries;

/** One generated manifest per chapter once production clips are imported. */
export const offlinePackManifests: readonly OfflinePackManifest[] =
  generatedOfflinePackManifests;

export const productionVoiceManifest: ProductionVoiceManifest = {
  schemaVersion: 1,
  storyId: "return-to-me-school-years",
  contentRevision: STORY_REVISION,
  disclosure:
    generatedVoiceDisclosure ??
    "Character voices are synthetic performances created for this story; no real person's voice is cloned.",
  audio: {
    container: "mp3",
    sampleRateHz: 48_000,
    targetBitrateKbps: 96,
    channels: 1,
    targetLufs: -16,
    maxPeakDb: -1,
  },
  profiles: voiceProfiles,
  entries: voiceEntries,
  offlinePacks: offlinePackManifests,
};
