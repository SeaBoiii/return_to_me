import type { StageSnapshot, StoryNode } from "../engine/types";

export const line = (
  id: string,
  chapterId: string,
  stage: StageSnapshot,
  speakerId: string | null,
  text: string,
  next: string,
): StoryNode => ({
  id,
  type: "line",
  chapterId,
  stage,
  speakerId,
  text,
  next,
});

export const choice = (
  id: string,
  chapterId: string,
  stage: StageSnapshot,
  prompt: string,
  choices: readonly { id: string; label: string; next: string }[],
): StoryNode => ({
  id,
  type: "choice",
  chapterId,
  stage,
  prompt,
  choices,
});

export const ending = (
  id: string,
  chapterId: string,
  stage: StageSnapshot,
  title: string,
  text?: string,
): StoryNode => ({
  id,
  type: "end",
  chapterId,
  stage,
  title,
  ...(text ? { text } : {}),
});

