import { STORY_REVISION } from '../story/metadata';

export const PWA_CACHE_NAMESPACE = 'return-to-me';

/**
 * Bump this whenever deployed story or voice assets become incompatible with
 * the previous release. Keep it aligned with the story save revision.
 */
export const PWA_CONTENT_REVISION = STORY_REVISION;

export const VOICE_CACHE_PREFIX = `${PWA_CACHE_NAMESPACE}-voices-`;
export const VOICE_CACHE_NAME = `${VOICE_CACHE_PREFIX}${PWA_CONTENT_REVISION}`;

export function voiceCacheName(contentRevision: string): string {
  const safeRevision = contentRevision
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!safeRevision) {
    throw new Error('A non-empty content revision is required.');
  }

  return `${VOICE_CACHE_PREFIX}${safeRevision}`;
}
