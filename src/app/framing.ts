import type { AssetFocalPoint, AssetProtectedBounds } from '../engine';

/** Match CSS object-position's overflow alignment, then protect authored subjects. */
export function sceneFit(
  image: { width: number; height: number; focalPoint: AssetFocalPoint; protectedBounds?: AssetProtectedBounds },
  frame: { width: number; height: number },
): 'cover' | 'contain' {
  if (!image.protectedBounds || frame.width <= 0 || frame.height <= 0) return 'cover';
  const scale = Math.max(frame.width / image.width, frame.height / image.height);
  const width = frame.width / (image.width * scale);
  const height = frame.height / (image.height * scale);
  const left = (1 - width) * image.focalPoint.x;
  const top = (1 - height) * image.focalPoint.y;
  const safe = image.protectedBounds;
  const tolerance = 0.002;
  return left <= safe.x + tolerance && top <= safe.y + tolerance
    && left + width >= safe.x + safe.width - tolerance
    && top + height >= safe.y + safe.height - tolerance ? 'cover' : 'contain';
}
