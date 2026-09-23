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
  {
    id: "syafiqa",
    speakerId: "syafiqa",
    displayName: "Syafiqa",
    direction:
      "Age-appropriate teenage voice; easygoing and familiar, becoming gentle but firm when setting a boundary.",
    synthetic: true,
  },
  {
    id: "mei-lin",
    speakerId: "mei-lin",
    displayName: "Mei Lin",
    direction:
      "Age-appropriate teenage voice; diligent, quietly funny, and supportive without romantic implication.",
    synthetic: true,
  },
  {
    id: "aleem-adult",
    speakerId: "aleem-adult",
    displayName: "Aleem in university, working life, and Umrah",
    direction:
      "Natural Singaporean English; an adult speaking in the moment, warm with friends and hesitant when exposing his feelings. During Umrah, allow quiet ease and relief without grand performance. Distinct from the measured retrospective narrator.",
    synthetic: true,
  },
  {
    id: "jia-wen",
    speakerId: "jia-wen",
    displayName: "Jia Wen",
    direction:
      "Young adult Singaporean English; lively and familiar with a close friend, becoming quietly surprised and sincere during the confession.",
    synthetic: true,
  },
  {
    id: "claire",
    speakerId: "claire",
    displayName: "Claire",
    direction:
      "Adult Singaporean English; easy conversational warmth, with a clear and considerate boundary when discussing her faith and relationships.",
    synthetic: true,
  },
  {
    id: "imran",
    speakerId: "imran",
    displayName: "Imran",
    direction:
      "Adult Singaporean English; a steady, practical friend, understated and reassuring about the journey ahead.",
    synthetic: true,
  },
  {
    id: "young-adult-aleem",
    speakerId: "aleem-young-adult",
    displayName: "Young Adult Aleem",
    direction:
      "Young adult Singaporean English; earnest and hopeful in National Service, becoming guarded without melodrama.",
    synthetic: true,
  },
  {
    id: "nadiah",
    speakerId: "nadiah",
    displayName: "Nadiah",
    direction:
      "Adult Singaporean English; warm and natural in the earlier relationship, candid and restrained during its difficult conversation. Her older Umrah portrayal retains the familiar warmth, with pauses and inward hesitation that do not confirm the narrator's interpretation.",
    synthetic: true,
  },
  {
    id: "aisyah",
    speakerId: "aisyah",
    displayName: "Aisyah",
    direction:
      "Young adult Singaporean English; concerned, direct, and careful not to claim more than she knows.",
    synthetic: true,
  },
  {
    id: "hakim",
    speakerId: "hakim",
    displayName: "Hakim",
    direction:
      "Young adult Singaporean English; friendly, grounded, and casually welcoming.",
    synthetic: true,
  },
  {
    id: "mariam",
    speakerId: "mariam",
    displayName: "Kak Mariam",
    direction:
      "Adult Singaporean English; relaxed and warmly practical with fellow travellers. Offer an introduction with ordinary kindness, without announcing destiny or a promised outcome.",
    synthetic: true,
  },
  {
    id: "yusuf",
    speakerId: "yusuf",
    displayName: "Abang Yusuf",
    direction:
      "Adult Singaporean English; easy, good-humoured companionship and quiet attentiveness. Mariam's husband, welcoming without intruding.",
    synthetic: true,
  },
  {
    id: "nurulain",
    speakerId: "nurulain",
    displayName: "Nurulain",
    direction:
      "Adult Singaporean English; curious and naturally conversational, sometimes guarded while getting to know Aleem. Let warmth grow through ordinary questions and shared ease, with a sincere, unhurried confession.",
    synthetic: true,
  },
  {
    id: "nurul-mother",
    speakerId: "nurul-mother",
    displayName: "Nurul's Mother",
    direction:
      "Adult Singaporean English; welcoming and gently curious about the person her daughter is getting to know. Conversational and attentive without interrogating him.",
    synthetic: true,
  },
  {
    id: "nurul-father",
    speakerId: "nurul-father",
    displayName: "Nurul's Father",
    direction:
      "Adult Singaporean English; calm, friendly curiosity at a family restaurant meeting. Grounded and considerate, without a formal or imposing performance.",
    synthetic: true,
  },
] as const satisfies readonly VoiceProfile[];

/**
 * The generated module contains complete imported chapters. Chapters without
 * audio remain fully playable with subtitles; a full-story import is optional.
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
