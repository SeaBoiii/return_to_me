import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { StagePosition, StoryNode } from '../engine';
import { getAssetEntry } from '../art/manifest';
import { getArtUrl, protectActiveArt } from '../pwa/artContent';
import { story } from '../story';
import { sceneFit } from './framing';
import { usePortrait } from './usePortrait';
import common from './App.module.css';
import styles from './Reader.module.css';

const positions = { 'far-left': 14, left: 28, center: 50, right: 72, 'far-right': 86 };
function positionStyle(position: StagePosition, layer = 1, flipped = false, verticalOffset = 0): CSSProperties {
  const point = typeof position === 'string' ? { x: positions[position], y: 100 } : position;
  return { left: `${Math.max(14, Math.min(86, point.x))}%`, bottom: `${100 - point.y + verticalOffset}%`,
    zIndex: layer, transform: `translateX(-50%)${flipped ? ' scaleX(-1)' : ''}` };
}

export const ReadingStage = memo(function ReadingStage({ node, reducedMotion }: {
  node: StoryNode; reducedMotion: boolean;
}) {
  const portrait = usePortrait();
  const background = getAssetEntry(node.stage.backgroundId);
  const selected = (portrait ? background?.mobile : undefined) ?? background;
  const frameRef = useRef<HTMLElement>(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = selected ? getArtUrl(selected.url) : undefined;
  const missing = url === undefined || failedUrl === url;
  const focus = selected?.focalPoint ?? { x: 0.5, y: 0.5 };

  useEffect(() => {
    const element = frameRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setFrame({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    protectActiveArt([...(url ? [url] : []), ...node.stage.sprites.flatMap(sprite => {
      const asset = getAssetEntry(sprite.assetId);
      return asset ? [getArtUrl(asset.url)] : [];
    })]);
  }, [url, node.stage.sprites]);

  // Decode the current scene first; warm just the next known scene, never a choice route.
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (!url || node.type !== 'line' || connection?.saveData) return;
    let cancelled = false;
    const images: HTMLImageElement[] = [];
    const warmNext = async () => {
      const current = new Image();
      current.src = url;
      try { await current.decode(); } catch { return; }
      if (cancelled) return;
      const next = story.nodes.find(candidate => candidate.id === node.next);
      if (!next || next.type !== 'line') return;
      const nextBackground = getAssetEntry(next.stage.backgroundId);
      const candidate = (portrait ? nextBackground?.mobile : undefined) ?? nextBackground;
      const urls = new Set([...(candidate ? [getArtUrl(candidate.url)] : []),
        ...next.stage.sprites.flatMap(sprite => {
          const asset = getAssetEntry(sprite.assetId);
          return asset ? [getArtUrl(asset.url)] : [];
        })]);
      for (const source of urls) {
        if (cancelled || source === url) continue;
        const image = new Image();
        image.decoding = 'async'; image.src = source; images.push(image);
      }
    };
    void warmNext();
    return () => { cancelled = true; for (const image of images) image.removeAttribute('src'); };
  }, [url, node, portrait]);

  return <figure ref={frameRef} className={styles.stage} data-art-kind={background?.kind}
    data-transition={reducedMotion ? 'none' : node.stage.transition} aria-label={`Scene: ${background?.alt ?? node.stage.mood}`}>
    {selected && <img key={url} className={styles.sceneImage} src={url} alt=""
      width={selected.width} height={selected.height} draggable={false}
      data-testid={background?.kind === 'cg' ? 'cg-composition' : 'scene-background'}
      data-variant={portrait && background?.mobile ? 'mobile' : 'original'}
      style={{ objectFit: sceneFit(selected, frame), objectPosition: `${focus.x * 100}% ${focus.y * 100}%` }}
      onLoad={() => setFailedUrl(failed => failed === url ? undefined : failed)}
      onError={() => setFailedUrl(url)} />}
    {missing && <p className={styles.missingArt} role="status">Artwork is unavailable here. Your story is still ready to read.</p>}
    <div className={styles.spriteLayer} data-count={node.stage.sprites.length} aria-hidden="true">
      {node.stage.sprites.map(sprite => {
        const asset = getAssetEntry(sprite.assetId);
        if (!asset) return null;
        const active = node.type !== 'line' || node.speakerId === null
          || node.speakerId === sprite.characterId || node.speakerId === 'adult-aleem';
        const facing = sprite.facing ?? 'right';
        const flipped = (facing === 'left') !== (sprite.mirror ?? false);
        const primaryAlya = asset.id.startsWith('alya-') && !asset.id.startsWith('alya-young-');
        return <img key={sprite.id} className={`${styles.sprite} ${active ? '' : styles.resting}`}
          src={getArtUrl(asset.url)} alt="" width={asset.width} height={asset.height} draggable={false}
          style={positionStyle(sprite.position, sprite.layer, flipped, primaryAlya ? -39 : 0)} data-facing={facing}
          data-family={primaryAlya ? 'alya' : undefined}
          data-mirrored={flipped ? 'true' : 'false'} />;
      })}
    </div>
    {node.stage.overlay && <section
      className={`${common.stageOverlay} ${common[`overlay_${node.stage.overlay.kind}`]} ${styles.sceneOverlay}`}
      aria-label={node.stage.overlay.label} data-overlay-kind={node.stage.overlay.kind} tabIndex={0}>
      {node.stage.overlay.title && <h3>{node.stage.overlay.title}</h3>}
      {node.stage.overlay.lines.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
    </section>}
  </figure>;
});
