import type {
  AssetEntry,
  StageSnapshot,
  StoryDefinition,
  VoiceEntry,
} from "./types";

export const testStage: StageSnapshot = {
  backgroundId: "bg-room",
  sprites: [],
  transition: "none",
  mood: "neutral",
};

export const testStory: StoryDefinition = {
  id: "test-story",
  title: "Test Story",
  revision: "test-1",
  startNodeId: "line-1",
  chapters: [
    {
      id: "chapter-1",
      title: "One",
      startNodeId: "line-1",
    },
    {
      id: "chapter-2",
      title: "Two",
      startNodeId: "line-2",
    },
  ],
  speakers: [
    {
      id: "narrator",
      name: "Narrator",
      role: "narrator",
    },
  ],
  nodes: [
    {
      id: "line-1",
      type: "line",
      chapterId: "chapter-1",
      stage: testStage,
      speakerId: "narrator",
      text: "A remembered beginning.",
      next: "choice-1",
    },
    {
      id: "choice-1",
      type: "choice",
      chapterId: "chapter-1",
      stage: testStage,
      prompt: "What should be remembered?",
      choices: [
        { id: "honest", label: "Be honest", next: "line-2" },
        { id: "quiet", label: "Stay quiet", next: "line-2" },
      ],
    },
    {
      id: "line-2",
      type: "line",
      chapterId: "chapter-2",
      stage: testStage,
      speakerId: "narrator",
      text: "Both memories return to the same road.",
      next: "end",
    },
    {
      id: "end",
      type: "end",
      chapterId: "chapter-2",
      stage: testStage,
      title: "Continue?",
    },
  ],
};

export const testAssets: readonly AssetEntry[] = [
  {
    id: "bg-room",
    kind: "background",
    url: "assets/bg-room.webp",
    width: 1600,
    height: 900,
    focalPoint: { x: 0.5, y: 0.5 },
    preloadGroup: "chapter-1",
  },
];

export const testVoices: readonly VoiceEntry[] = [
  {
    id: "voice-line-1",
    lineId: "line-1",
    speakerId: "narrator",
    url: "voices/line-1.mp3",
    durationMs: 1_000,
    packId: "pack-1",
    provenance: {
      provider: "test",
      profile: "test-narrator",
      license: "test-only",
      synthetic: true,
    },
  },
  {
    id: "voice-line-2",
    lineId: "line-2",
    speakerId: "narrator",
    url: "voices/line-2.mp3",
    durationMs: 1_000,
    packId: "pack-2",
    provenance: {
      provider: "test",
      profile: "test-narrator",
      license: "test-only",
      synthetic: true,
    },
  },
];
