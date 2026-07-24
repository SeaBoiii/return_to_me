import { describe, expect, it } from 'vitest';

import { appPathname, resolveAppUrl } from './basePath';

describe('resolveAppUrl', () => {
  it('places root-looking manifest paths beneath the deployment base', () => {
    expect(
      resolveAppUrl(
        '/voices/chapter-1/line-001.mp3',
        '/return-to-me/',
        'https://example.test',
      ),
    ).toBe(
      'https://example.test/return-to-me/voices/chapter-1/line-001.mp3',
    );
  });

  it('preserves fully qualified URLs', () => {
    expect(
      resolveAppUrl(
        'https://cdn.example.test/voice.mp3',
        '/return-to-me/',
        'https://example.test',
      ),
    ).toBe('https://cdn.example.test/voice.mp3');
  });

  it('normalizes a base path without a trailing slash', () => {
    expect(
      appPathname('assets/art.webp', '/owner/project'),
    ).toBe('/owner/project/assets/art.webp');
  });

  it('rejects empty asset paths', () => {
    expect(() => resolveAppUrl('  ')).toThrow('asset path');
  });

  it('does not duplicate an asset path that already contains the base', () => {
    expect(
      resolveAppUrl(
        '/owner/project/voices/line.mp3',
        '/owner/project/',
        'https://example.test',
      ),
    ).toBe('https://example.test/owner/project/voices/line.mp3');
  });
});
