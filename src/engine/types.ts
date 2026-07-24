/**
 * Stable, serialisable authoring and runtime contracts for the visual-novel
 * engine. Story content deliberately uses string IDs rather than imports so it
 * can be validated at build time and stored safely in localStorage.
 */

export type StoryId = string;
export type StoryRevision = string;
export type NodeId = string;
export type ChapterId = string;
export type SpeakerId = string;
export type AssetId = string;
export type VoiceId = string;
export type OfflinePackId = string;
export type ChoiceId = string;

export type StageTransition = "none" | "cut" | "fade" | "dissolve" | "slide";
export type StageMood = string;

export type NamedStagePosition =
  | "far-left"
  | "left"
  | "center"
  | "right"
  | "far-right";

export interface CoordinateStagePosition {
  /** Horizontal position as a percentage of the stage width. */
  readonly x: number;
  /** Vertical position as a percentage of the stage height. */
  readonly y: number;
}

export type StagePosition = NamedStagePosition | CoordinateStagePosition;

export interface StageSprite {
  /** Unique within this snapshot; useful as a stable React key. */
  readonly id: string;
  readonly assetId: AssetId;
  readonly characterId: string;
  readonly position: StagePosition;
  readonly expression?: string;
  readonly facing?: "left" | "right";
  readonly mirror?: boolean;
  /** Allows the UI to visually prioritise the current speaker. */
  readonly focus?: boolean;
  readonly layer?: number;
}

/**
 * Textual overlays are intentionally data, not pixels baked into an image.
 * The UI can render `label` to assistive technology and render each line as
 * selectable, scalable HTML.
 */
export interface StageOverlay {
  readonly kind: "sms" | "server" | "results" | "caption";
  readonly label: string;
  readonly title?: string;
  readonly lines: readonly string[];
}

/**
 * A complete stage description. Nodes never inherit visual state from a
 * previous node, which makes chapter jumps and save restoration deterministic.
 */
export interface StageSnapshot {
  readonly backgroundId: AssetId;
  readonly sprites: readonly StageSprite[];
  readonly transition: StageTransition;
  readonly mood: StageMood;
  readonly overlay?: StageOverlay;
}

export interface StoryNodeBase {
  readonly id: NodeId;
  readonly chapterId: ChapterId;
  readonly stage: StageSnapshot;
}

export interface LineNode extends StoryNodeBase {
  readonly type: "line";
  /** `null` is reserved for an intentionally silent/system line. */
  readonly speakerId: SpeakerId | null;
  readonly text: string;
  readonly next: NodeId;
}

export interface ChoiceOption {
  readonly id: ChoiceId;
  readonly label: string;
  readonly next: NodeId;
}

export interface ChoiceNode extends StoryNodeBase {
  readonly type: "choice";
  readonly prompt: string;
  readonly choices: readonly ChoiceOption[];
}

export interface EndNode extends StoryNodeBase {
  readonly type: "end";
  readonly title: string;
  readonly text?: string;
}

export type StoryNode = LineNode | ChoiceNode | EndNode;

export interface ChapterDefinition {
  readonly id: ChapterId;
  readonly title: string;
  readonly period?: string;
  readonly startNodeId: NodeId;
}

export interface SpeakerDefinition {
  readonly id: SpeakerId;
  readonly name: string;
  readonly shortName?: string;
  readonly role?: "character" | "narrator" | "system";
}

export interface StoryDefinition {
  readonly id: StoryId;
  readonly title: string;
  readonly subtitle?: string;
  /** Change whenever old saves can no longer safely address the same nodes. */
  readonly revision: StoryRevision;
  readonly startNodeId: NodeId;
  readonly chapters: readonly ChapterDefinition[];
  readonly speakers: readonly SpeakerDefinition[];
  readonly nodes: readonly StoryNode[];
}

export type AssetKind = "background" | "sprite" | "cg" | "ui";

export interface AssetFocalPoint {
  /** Normalised 0–1 coordinate. */
  readonly x: number;
  /** Normalised 0–1 coordinate. */
  readonly y: number;
}

export interface AssetProvenance {
  readonly creator: string;
  readonly source?: string;
  readonly promptReference?: string;
  readonly license?: string;
}

export interface AssetEntry {
  readonly id: AssetId;
  readonly kind: AssetKind;
  /** Imported/bundled URL, or a URL resolved against Vite's base path. */
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly focalPoint: AssetFocalPoint;
  readonly preloadGroup: string;
  readonly alt?: string;
  readonly provenance?: AssetProvenance;
}

export interface VoiceProvenance {
  readonly provider: string;
  readonly profile: string;
  readonly license: string;
  /** Provider delivery, invoice, consent, or other clip-level audit reference. */
  readonly sourceReference?: string;
  readonly synthetic: true;
}

export interface VoiceEntry {
  readonly id: VoiceId;
  readonly lineId: NodeId;
  readonly speakerId: SpeakerId;
  readonly url: string;
  readonly durationMs: number;
  readonly packId: OfflinePackId;
  readonly provenance: VoiceProvenance;
}

export interface OfflinePackManifest {
  readonly id: OfflinePackId;
  readonly chapterId: ChapterId;
  readonly title: string;
  readonly voiceUrls: readonly string[];
  readonly expectedBytes: number;
  readonly contentRevision: StoryRevision;
}

export interface LineHistoryEntry {
  readonly kind: "line";
  readonly nodeId: NodeId;
}

export interface ChoiceHistoryEntry {
  readonly kind: "choice";
  readonly nodeId: NodeId;
  readonly optionId: ChoiceId;
}

export type HistoryEntry = LineHistoryEntry | ChoiceHistoryEntry;
export type EngineStatus = "idle" | "playing" | "ended";

export interface EngineState {
  readonly status: EngineStatus;
  readonly currentNodeId: NodeId;
  readonly history: readonly HistoryEntry[];
  /** One remembered selection per choice node. */
  readonly rememberedChoices: Readonly<Record<NodeId, ChoiceId>>;
  readonly unlockedChapters: readonly ChapterId[];
  /** Nodes completed by advancing or selecting, retained across New Game. */
  readonly seenNodeIds: readonly NodeId[];
}

export interface SaveV1 {
  readonly version: 1;
  readonly storyId: StoryId;
  readonly storyRevision: StoryRevision;
  readonly currentNodeId: NodeId;
  readonly status: Exclude<EngineStatus, "idle">;
  readonly history: readonly HistoryEntry[];
  readonly rememberedChoices: Readonly<Record<NodeId, ChoiceId>>;
  readonly unlockedChapters: readonly ChapterId[];
  readonly seenNodeIds: readonly NodeId[];
  /** Unix epoch milliseconds. */
  readonly timestamp: number;
}

export interface SettingsV1 {
  readonly version: 1;
  /** Delay between characters. Zero enables instant text. */
  readonly textSpeedMs: number;
  readonly autoMode: boolean;
  readonly skipSeen: boolean;
  readonly volume: number;
  readonly muted: boolean;
  readonly reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: SettingsV1 = Object.freeze({
  version: 1,
  textSpeedMs: 24,
  autoMode: false,
  skipSeen: false,
  volume: 0.9,
  muted: false,
  reducedMotion: false,
});

export type StoryAction =
  | { readonly type: "START_NEW" }
  | { readonly type: "ADVANCE" }
  | { readonly type: "CHOOSE"; readonly optionId: ChoiceId }
  | { readonly type: "JUMP_TO_CHAPTER"; readonly chapterId: ChapterId }
  | { readonly type: "LOAD_SAVE"; readonly save: SaveV1 }
  | { readonly type: "RESET" };
