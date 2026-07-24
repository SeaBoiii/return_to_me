import type {
  AssetEntry,
  AssetId,
  OfflinePackManifest,
  StageSnapshot,
  StoryDefinition,
  StoryNode,
  VoiceEntry,
} from "./types";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface StoryValidationOptions {
  readonly assets?: readonly AssetEntry[];
  readonly voices?: readonly VoiceEntry[];
  readonly offlinePacks?: readonly OfflinePackManifest[];
  /** Require one, and only one, voice entry for every line with a speaker. */
  readonly requireVoiceCoverage?: boolean;
}

const issue = (
  code: string,
  message: string,
  path?: string,
  severity: ValidationSeverity = "error",
): ValidationIssue => ({
  severity,
  code,
  message,
  ...(path === undefined ? {} : { path }),
});

const duplicateValues = (values: readonly string[]): readonly string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates];
};

const graphTargets = (node: StoryNode): readonly string[] => {
  switch (node.type) {
    case "line":
      return [node.next];
    case "choice":
      return node.choices.map((choice) => choice.next);
    case "end":
      return [];
  }
};

const validateStage = (
  stage: StageSnapshot | undefined,
  nodePath: string,
  assets: ReadonlyMap<AssetId, AssetEntry> | undefined,
): readonly ValidationIssue[] => {
  if (stage === undefined || stage === null) {
    return [
      issue("missing-stage", "Every story node needs a complete stage.", nodePath),
    ];
  }

  const issues: ValidationIssue[] = [];
  if (stage.backgroundId.length === 0) {
    issues.push(
      issue(
        "missing-background",
        "Stage backgroundId cannot be empty.",
        `${nodePath}.stage.backgroundId`,
      ),
    );
  } else if (assets !== undefined) {
    const background = assets.get(stage.backgroundId);
    if (background === undefined) {
      issues.push(
        issue(
          "unknown-asset",
          `Unknown background asset "${stage.backgroundId}".`,
          `${nodePath}.stage.backgroundId`,
        ),
      );
    } else if (background.kind !== "background" && background.kind !== "cg") {
      issues.push(
        issue(
          "wrong-asset-kind",
          `Stage background "${stage.backgroundId}" is a ${background.kind} asset.`,
          `${nodePath}.stage.backgroundId`,
        ),
      );
    }
  }

  for (const duplicate of duplicateValues(
    stage.sprites.map((sprite) => sprite.id),
  )) {
    issues.push(
      issue(
        "duplicate-sprite-id",
        `Sprite instance ID "${duplicate}" is repeated in one stage.`,
        `${nodePath}.stage.sprites`,
      ),
    );
  }

  stage.sprites.forEach((sprite, index) => {
    const spritePath = `${nodePath}.stage.sprites[${index}]`;
    if (sprite.id.length === 0 || sprite.characterId.length === 0) {
      issues.push(
        issue(
          "invalid-sprite",
          "Sprite ID and character ID cannot be empty.",
          spritePath,
        ),
      );
    }
    if (assets !== undefined) {
      const asset = assets.get(sprite.assetId);
      if (asset === undefined) {
        issues.push(
          issue(
            "unknown-asset",
            `Unknown sprite asset "${sprite.assetId}".`,
            `${spritePath}.assetId`,
          ),
        );
      } else if (asset.kind !== "sprite") {
        issues.push(
          issue(
            "wrong-asset-kind",
            `Stage sprite "${sprite.assetId}" is a ${asset.kind} asset.`,
            `${spritePath}.assetId`,
          ),
        );
      }
    }

    if (
      typeof sprite.position === "object" &&
      (sprite.position.x < 0 ||
        sprite.position.x > 100 ||
        sprite.position.y < 0 ||
        sprite.position.y > 100)
    ) {
      issues.push(
        issue(
          "invalid-position",
          "Coordinate sprite positions must be percentages from 0 to 100.",
          `${spritePath}.position`,
        ),
      );
    }
  });

  if (stage.mood.trim().length === 0) {
    issues.push(
      issue(
        "missing-mood",
        "Stage mood cannot be empty.",
        `${nodePath}.stage.mood`,
      ),
    );
  }

  if (stage.overlay !== undefined) {
    if (
      stage.overlay.label.trim().length === 0 ||
      !Array.isArray(stage.overlay.lines)
    ) {
      issues.push(
        issue(
          "invalid-overlay",
          "An overlay needs an accessible label and an array of text lines.",
          `${nodePath}.stage.overlay`,
        ),
      );
    }
  }

  return issues;
};

export const validateAssetCatalog = (
  assets: readonly AssetEntry[],
): readonly ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  for (const duplicate of duplicateValues(assets.map((asset) => asset.id))) {
    issues.push(
      issue(
        "duplicate-asset-id",
        `Asset ID "${duplicate}" is defined more than once.`,
        "assets",
      ),
    );
  }

  assets.forEach((asset, index) => {
    const path = `assets[${index}]`;
    if (asset.id.trim().length === 0 || asset.url.trim().length === 0) {
      issues.push(
        issue("invalid-asset", "Asset ID and URL cannot be empty.", path),
      );
    }
    if (
      !Number.isFinite(asset.width) ||
      !Number.isFinite(asset.height) ||
      asset.width <= 0 ||
      asset.height <= 0
    ) {
      issues.push(
        issue(
          "invalid-asset-dimensions",
          "Asset dimensions must be positive finite numbers.",
          path,
        ),
      );
    }
    if (
      !Number.isFinite(asset.focalPoint.x) ||
      !Number.isFinite(asset.focalPoint.y) ||
      asset.focalPoint.x < 0 ||
      asset.focalPoint.x > 1 ||
      asset.focalPoint.y < 0 ||
      asset.focalPoint.y > 1
    ) {
      issues.push(
        issue(
          "invalid-focal-point",
          "Asset focal points must use normalised 0–1 coordinates.",
          `${path}.focalPoint`,
        ),
      );
    }
    if (asset.preloadGroup.trim().length === 0) {
      issues.push(
        issue(
          "invalid-preload-group",
          "Asset preloadGroup cannot be empty.",
          `${path}.preloadGroup`,
        ),
      );
    }
  });
  return issues;
};

export const validateVoiceCatalog = (
  story: StoryDefinition,
  voices: readonly VoiceEntry[],
  offlinePacks?: readonly OfflinePackManifest[],
): readonly ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const nodes = new Map(story.nodes.map((node) => [node.id, node]));
  const speakers = new Set(story.speakers.map((speaker) => speaker.id));
  const packIds =
    offlinePacks === undefined
      ? undefined
      : new Set(offlinePacks.map((pack) => pack.id));

  for (const duplicate of duplicateValues(voices.map((voice) => voice.id))) {
    issues.push(
      issue(
        "duplicate-voice-id",
        `Voice ID "${duplicate}" is defined more than once.`,
        "voices",
      ),
    );
  }
  for (const duplicate of duplicateValues(
    voices.map((voice) => voice.lineId),
  )) {
    issues.push(
      issue(
        "duplicate-line-voice",
        `Line "${duplicate}" has more than one voice clip.`,
        "voices",
      ),
    );
  }

  voices.forEach((voice, index) => {
    const path = `voices[${index}]`;
    const node = nodes.get(voice.lineId);
    if (node?.type !== "line") {
      issues.push(
        issue(
          "unknown-voice-line",
          `Voice "${voice.id}" points to a missing or non-line node.`,
          `${path}.lineId`,
        ),
      );
    } else if (node.speakerId !== voice.speakerId) {
      issues.push(
        issue(
          "voice-speaker-mismatch",
          `Voice speaker "${voice.speakerId}" does not match line speaker "${node.speakerId ?? "none"}".`,
          `${path}.speakerId`,
        ),
      );
    }

    if (!speakers.has(voice.speakerId)) {
      issues.push(
        issue(
          "unknown-voice-speaker",
          `Voice "${voice.id}" uses unknown speaker "${voice.speakerId}".`,
          `${path}.speakerId`,
        ),
      );
    }
    if (
      voice.url.trim().length === 0 ||
      !Number.isFinite(voice.durationMs) ||
      voice.durationMs <= 0
    ) {
      issues.push(
        issue(
          "invalid-voice",
          "Voice URL must be non-empty and duration must be positive.",
          path,
        ),
      );
    }
    if (packIds !== undefined && !packIds.has(voice.packId)) {
      issues.push(
        issue(
          "unknown-voice-pack",
          `Voice "${voice.id}" uses unknown pack "${voice.packId}".`,
          `${path}.packId`,
        ),
      );
    }
  });

  return issues;
};

export const validateOfflinePackCatalog = (
  story: StoryDefinition,
  packs: readonly OfflinePackManifest[],
  voices: readonly VoiceEntry[] = [],
): readonly ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const chapters = new Set(story.chapters.map((chapter) => chapter.id));
  const voiceUrlsByPack = new Map<string, Set<string>>();
  for (const voice of voices) {
    const urls = voiceUrlsByPack.get(voice.packId) ?? new Set<string>();
    urls.add(voice.url);
    voiceUrlsByPack.set(voice.packId, urls);
  }

  for (const duplicate of duplicateValues(packs.map((pack) => pack.id))) {
    issues.push(
      issue(
        "duplicate-pack-id",
        `Offline pack ID "${duplicate}" is defined more than once.`,
        "offlinePacks",
      ),
    );
  }

  packs.forEach((pack, index) => {
    const path = `offlinePacks[${index}]`;
    if (!chapters.has(pack.chapterId)) {
      issues.push(
        issue(
          "unknown-pack-chapter",
          `Offline pack "${pack.id}" uses unknown chapter "${pack.chapterId}".`,
          `${path}.chapterId`,
        ),
      );
    }
    if (
      !Number.isFinite(pack.expectedBytes) ||
      pack.expectedBytes < 0 ||
      pack.contentRevision !== story.revision
    ) {
      issues.push(
        issue(
          "invalid-pack-metadata",
          "Offline pack size must be non-negative and revision must match the story.",
          path,
        ),
      );
    }
    if (
      pack.voiceUrls.some((url) => url.trim().length === 0) ||
      duplicateValues(pack.voiceUrls).length > 0
    ) {
      issues.push(
        issue(
          "invalid-pack-urls",
          "Offline voice URLs must be non-empty and unique within a pack.",
          `${path}.voiceUrls`,
        ),
      );
    }

    const expectedUrls = voiceUrlsByPack.get(pack.id);
    if (
      voices.length > 0 &&
      expectedUrls !== undefined &&
      [...expectedUrls].some((url) => !pack.voiceUrls.includes(url))
    ) {
      issues.push(
        issue(
          "incomplete-pack",
          `Offline pack "${pack.id}" omits one or more of its voice clips.`,
          `${path}.voiceUrls`,
        ),
      );
    }
  });
  return issues;
};

const validateGraph = (
  story: StoryDefinition,
  nodes: ReadonlyMap<string, StoryNode>,
): readonly ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!nodes.has(story.startNodeId)) {
    return issues;
  }

  const reachable = new Set<string>();
  const pending = [story.startNodeId];
  while (pending.length > 0) {
    const nodeId = pending.pop();
    if (nodeId === undefined || reachable.has(nodeId)) {
      continue;
    }
    reachable.add(nodeId);
    const node = nodes.get(nodeId);
    if (node !== undefined) {
      pending.push(...graphTargets(node).filter((id) => nodes.has(id)));
    }
  }

  for (const node of story.nodes) {
    if (!reachable.has(node.id)) {
      issues.push(
        issue(
          "unreachable-node",
          `Node "${node.id}" cannot be reached from the story start.`,
          `nodes.${node.id}`,
        ),
      );
    }
  }

  const colour = new Map<string, "visiting" | "visited">();
  const reportedEdges = new Set<string>();
  const visit = (nodeId: string): void => {
    const current = colour.get(nodeId);
    if (current === "visited") {
      return;
    }
    if (current === "visiting") {
      return;
    }

    colour.set(nodeId, "visiting");
    const node = nodes.get(nodeId);
    if (node !== undefined) {
      for (const target of graphTargets(node)) {
        if (!nodes.has(target)) {
          continue;
        }
        if (colour.get(target) === "visiting") {
          const edge = `${node.id}->${target}`;
          if (!reportedEdges.has(edge)) {
            reportedEdges.add(edge);
            issues.push(
              issue(
                "illegal-cycle",
                `Story cycle detected from "${node.id}" to "${target}".`,
                `nodes.${node.id}`,
              ),
            );
          }
        } else {
          visit(target);
        }
      }
    }
    colour.set(nodeId, "visited");
  };

  for (const node of story.nodes) {
    visit(node.id);
  }
  return issues;
};

export const validateStory = (
  story: StoryDefinition,
  options: StoryValidationOptions = {},
): readonly ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const nodes = new Map(story.nodes.map((node) => [node.id, node]));
  const chapters = new Map(
    story.chapters.map((chapter) => [chapter.id, chapter]),
  );
  const speakers = new Set(story.speakers.map((speaker) => speaker.id));
  const assets =
    options.assets === undefined
      ? undefined
      : new Map(options.assets.map((asset) => [asset.id, asset]));

  if (story.id.trim().length === 0 || story.revision.trim().length === 0) {
    issues.push(
      issue(
        "invalid-story-metadata",
        "Story ID and revision cannot be empty.",
        "story",
      ),
    );
  }

  for (const [ids, code, label, path] of [
    [
      story.nodes.map((node) => node.id),
      "duplicate-node-id",
      "Node",
      "nodes",
    ],
    [
      story.chapters.map((chapter) => chapter.id),
      "duplicate-chapter-id",
      "Chapter",
      "chapters",
    ],
    [
      story.speakers.map((speaker) => speaker.id),
      "duplicate-speaker-id",
      "Speaker",
      "speakers",
    ],
  ] as const) {
    for (const duplicate of duplicateValues(ids)) {
      issues.push(
        issue(
          code,
          `${label} ID "${duplicate}" is defined more than once.`,
          path,
        ),
      );
    }
  }

  if (!nodes.has(story.startNodeId)) {
    issues.push(
      issue(
        "unknown-story-start",
        `Story start "${story.startNodeId}" does not exist.`,
        "startNodeId",
      ),
    );
  }

  story.chapters.forEach((chapter, index) => {
    const start = nodes.get(chapter.startNodeId);
    if (start === undefined) {
      issues.push(
        issue(
          "unknown-chapter-start",
          `Chapter "${chapter.id}" starts at unknown node "${chapter.startNodeId}".`,
          `chapters[${index}].startNodeId`,
        ),
      );
    } else if (start.chapterId !== chapter.id) {
      issues.push(
        issue(
          "chapter-start-mismatch",
          `Chapter "${chapter.id}" starts on a node assigned to "${start.chapterId}".`,
          `chapters[${index}].startNodeId`,
        ),
      );
    }
  });

  story.nodes.forEach((node, index) => {
    const path = `nodes[${index}]`;
    if (!chapters.has(node.chapterId)) {
      issues.push(
        issue(
          "unknown-node-chapter",
          `Node "${node.id}" uses unknown chapter "${node.chapterId}".`,
          `${path}.chapterId`,
        ),
      );
    }
    issues.push(...validateStage(node.stage, path, assets));

    if (node.type === "line") {
      if (node.text.trim().length === 0) {
        issues.push(
          issue("empty-line", `Line "${node.id}" has no text.`, `${path}.text`),
        );
      }
      if (node.speakerId !== null && !speakers.has(node.speakerId)) {
        issues.push(
          issue(
            "unknown-speaker",
            `Line "${node.id}" uses unknown speaker "${node.speakerId}".`,
            `${path}.speakerId`,
          ),
        );
      }
      if (!nodes.has(node.next)) {
        issues.push(
          issue(
            "broken-link",
            `Line "${node.id}" points to unknown node "${node.next}".`,
            `${path}.next`,
          ),
        );
      }
    } else if (node.type === "choice") {
      if (node.prompt.trim().length === 0 || node.choices.length < 2) {
        issues.push(
          issue(
            "invalid-choice",
            `Choice "${node.id}" needs a prompt and at least two options.`,
            path,
          ),
        );
      }
      for (const duplicate of duplicateValues(
        node.choices.map((option) => option.id),
      )) {
        issues.push(
          issue(
            "duplicate-option-id",
            `Choice "${node.id}" repeats option ID "${duplicate}".`,
            `${path}.choices`,
          ),
        );
      }
      node.choices.forEach((option, optionIndex) => {
        if (option.label.trim().length === 0 || !nodes.has(option.next)) {
          issues.push(
            issue(
              "invalid-option",
              `Option "${option.id}" needs text and a valid next node.`,
              `${path}.choices[${optionIndex}]`,
            ),
          );
        }
      });
    } else if (node.title.trim().length === 0) {
      issues.push(
        issue("invalid-end", `End node "${node.id}" needs a title.`, path),
      );
    }
  });

  issues.push(...validateGraph(story, nodes));

  if (options.assets !== undefined) {
    issues.push(...validateAssetCatalog(options.assets));
  }
  if (options.voices !== undefined) {
    issues.push(
      ...validateVoiceCatalog(story, options.voices, options.offlinePacks),
    );
  }
  if (options.offlinePacks !== undefined) {
    issues.push(
      ...validateOfflinePackCatalog(
        story,
        options.offlinePacks,
        options.voices,
      ),
    );
  }

  if (options.requireVoiceCoverage) {
    const voiceCount = new Map<string, number>();
    for (const voice of options.voices ?? []) {
      voiceCount.set(voice.lineId, (voiceCount.get(voice.lineId) ?? 0) + 1);
    }
    for (const node of story.nodes) {
      if (node.type === "line" && node.speakerId !== null) {
        const count = voiceCount.get(node.id) ?? 0;
        if (count !== 1) {
          issues.push(
            issue(
              "incomplete-voice-coverage",
              `Line "${node.id}" needs exactly one production voice clip (found ${count}).`,
              `nodes.${node.id}`,
            ),
          );
        }
      }
    }
  }

  return issues;
};

export const hasValidationErrors = (
  issues: readonly ValidationIssue[],
): boolean => issues.some((candidate) => candidate.severity === "error");

export const formatValidationIssues = (
  issues: readonly ValidationIssue[],
): string =>
  issues
    .map(
      (candidate) =>
        `[${candidate.severity}] ${candidate.code}${
          candidate.path === undefined ? "" : ` (${candidate.path})`
        }: ${candidate.message}`,
    )
    .join("\n");

export class StoryValidationError extends Error {
  public readonly issues: readonly ValidationIssue[];

  public constructor(issues: readonly ValidationIssue[]) {
    super(`Story validation failed:\n${formatValidationIssues(issues)}`);
    this.name = "StoryValidationError";
    this.issues = issues;
  }
}

export const assertValidStory = (
  story: StoryDefinition,
  options: StoryValidationOptions = {},
): void => {
  const issues = validateStory(story, options);
  if (hasValidationErrors(issues)) {
    throw new StoryValidationError(issues);
  }
};
