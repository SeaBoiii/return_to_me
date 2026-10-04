import { describe, expect, it } from 'vitest';
import { sceneFit } from './framing';

describe('protected scene framing', () => {
  const portrait = { width: 960, height: 1200, focalPoint: { x: 0.5, y: 0.5 },
    protectedBounds: { x: 0.08, y: 0.2, width: 0.84, height: 0.6 } };
  it('fills portrait and compact 4:3 panels when every subject is protected', () => {
    expect(sceneFit(portrait, { width: 390, height: 480 })).toBe('cover');
    expect(sceneFit(portrait, { width: 400, height: 300 })).toBe('cover');
  });
  it('contains instead of losing faces in an unusually short panel', () => {
    expect(sceneFit(portrait, { width: 390, height: 150 })).toBe('contain');
  });
  it('checks off-center object-position rather than assuming a central crop', () => {
    const wide = { width: 1600, height: 900, focalPoint: { x: 0, y: 0.5 },
      protectedBounds: { x: 0, y: 0.1, width: 0.2, height: 0.7 } };
    expect(sceneFit(wide, { width: 300, height: 500 })).toBe('cover');
    expect(sceneFit({ ...wide, focalPoint: { x: 1, y: 0.5 } }, { width: 300, height: 500 })).toBe('contain');
  });
});
