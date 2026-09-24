import { useEffect, useRef, useState } from 'react';
import type { ExpeditionMap } from '../data/expeditionMaps';
import type { HamsterAnimationAction, HamsterSkin } from '../types/hamster';
import { hamsterAssetUrl } from '../utils/hamsterAssets';

const WIDTH = 960;
const HEIGHT = 320;
const TILE = 32;
const MAP_WIDTH = 90 * TILE;
const WALK_SPEED = 0.095;
const FRAME_DURATION = 1000 / 16;
const SLEEP_FRAME_DURATION = 1000 / 12;

interface TileMap { width: number; height: number; layers: { data: number[] }[] }
interface SceneAssets {
  base: HTMLImageElement | null;
  scenery: HTMLImageElement | null;
  terrain: HTMLCanvasElement | null;
  groundY: number[];
}

const sceneCache = new Map<string, Promise<SceneAssets>>();
const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
  imageCache.set(url, promise);
  promise.catch(() => imageCache.delete(url));
  return promise;
}

async function loadScene(map: ExpeditionMap): Promise<SceneAssets> {
  const cached = sceneCache.get(map.id);
  if (cached) return cached;

  const promise = (async () => {
    const directory = `${import.meta.env.BASE_URL}expedition/maps/${map.id}/`;
    const optionalImage = (file?: string) => file ? loadImage(`${directory}${file}`).catch(() => null) : Promise.resolve(null);
    const [base, scenery, sheet] = await Promise.all([
      optionalImage(map.base), optionalImage(map.scenery), optionalImage(map.tiles),
    ]);

    if (!sheet) return { base, scenery, terrain: null, groundY: [] };
    const terrain = document.createElement('canvas');
    terrain.width = MAP_WIDTH;
    terrain.height = HEIGHT;
    const context = terrain.getContext('2d');
    if (!context) return { base, scenery, terrain: null, groundY: [] };
    context.imageSmoothingEnabled = false;
    const columns = Math.floor(sheet.naturalWidth / TILE);
    const groundY: number[] = [];
    for (const file of ['layer2.json', 'layer4.json']) {
      const response = await fetch(`${directory}${file}`);
      if (!response.ok) continue;
      const data = await response.json() as TileMap;
      for (let index = 0; index < data.layers[0].data.length; index += 1) {
        const gid = data.layers[0].data[index] & 0x1fffffff;
        if (!gid) continue;
        if (file === 'layer4.json' && groundY[index % data.width] === undefined) {
          groundY[index % data.width] = Math.floor(index / data.width) * TILE;
        }
        const tileIndex = gid - 1;
        context.drawImage(
          sheet,
          (tileIndex % columns) * TILE,
          Math.floor(tileIndex / columns) * TILE,
          TILE, TILE,
          (index % data.width) * TILE,
          Math.floor(index / data.width) * TILE,
          TILE, TILE,
        );
      }
    }
    return { base, scenery, terrain, groundY };
  })();
  sceneCache.set(map.id, promise);
  return promise;
}

function drawParallax(ctx: CanvasRenderingContext2D, image: HTMLImageElement, offset: number, speed: number) {
  const width = 768;
  const scroll = (offset * speed) % width;
  for (let x = -scroll; x < WIDTH; x += width) {
    ctx.drawImage(image, x, 0, width, HEIGHT);
  }
}

interface Props {
  map: ExpeditionMap;
  skin: HamsterSkin;
  name: string;
  animation: HamsterAnimationAction;
  reactionTrigger: number;
  reactionLabel: string;
}

export default function ExpeditionScene({ map, skin, name, animation, reactionTrigger, reactionLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reactionRequestRef = useRef(0);
  const progressRef = useRef({ mapId: map.id, name, distance: 0 });
  const [failedKey, setFailedKey] = useState('');
  const requestKey = `${map.id}:${skin.walk}:${animation}`;

  useEffect(() => {
    let cancelled = false;
    let frameId = 0;
    const selectedAnimation = skin.animations[animation] ?? skin.animations.walk;
    const walkAnimation = skin.animations.walk;
    const jumpAnimation = skin.animations.jump;
    const tapAnimation = skin.animations.tap_reaction;
    const chestMode = animation === 'take_chest';
    if (!selectedAnimation || !walkAnimation) return;
    let seenReactionRequest = reactionRequestRef.current;
    Promise.all([
      loadScene(map),
      loadImage(hamsterAssetUrl(walkAnimation.path)),
      jumpAnimation ? loadImage(hamsterAssetUrl(jumpAnimation.path)).catch(() => null) : Promise.resolve(null),
      tapAnimation ? loadImage(hamsterAssetUrl(tapAnimation.path)).catch(() => null) : Promise.resolve(null),
      loadImage(hamsterAssetUrl(selectedAnimation.path)),
      loadImage(`${import.meta.env.BASE_URL}expedition/chest.png`).catch(() => null),
    ])
      .then(([scene, walkSprite, jumpSprite, tapSprite, selectedSprite, chestSprite]) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        const started = performance.now();
        let previewStarted = started;
        let sleepFrameIndex = 0;
        let lastSleepAdvance = started;
        let footY: number | null = null;
        let jump: { start: number; from: number; to: number; height: number } | null = null;
        let reactionStarted: number | null = null;
        let lastAutoJump = -800;
        let lastFrame = started;
        let worldScroll = progressRef.current.mapId === map.id && progressRef.current.name === name
          ? progressRef.current.distance : 0;
        progressRef.current = { mapId: map.id, name, distance: worldScroll };
        let chestWorld = worldScroll + WIDTH / 2 + 310;
        let chestStarted: number | null = null;
        let chestRestUntil = 0;
        const jumpFrameDuration = 1000 / 20;
        const jumpDuration = Math.max(1, jumpAnimation?.frames ?? 1) * jumpFrameDuration;
        const reactionDuration = Math.max(1, tapAnimation?.frames ?? 1) * FRAME_DURATION;
        const chestDuration = Math.max(1, selectedAnimation.frames) * FRAME_DURATION;
        const animate = (now: number) => {
          const elapsed = now - started;
          const delta = Math.min(now - lastFrame, 50);
          lastFrame = now;
          const waitingToLandByChest = chestMode && chestStarted === null && jump !== null
            && chestWorld - worldScroll <= WIDTH / 2 + 44;
          if (animation === 'walk' || (chestMode && chestStarted === null && now >= chestRestUntil && !waitingToLandByChest)) {
            worldScroll += delta * WALK_SPEED;
            progressRef.current.distance = worldScroll;
          }
          if (chestMode && chestStarted !== null && now - chestStarted >= chestDuration) {
            chestStarted = null;
            chestRestUntil = now + 350;
            chestWorld = worldScroll + WIDTH / 2 + 310;
          }
          // Repeat the full road canvas; the viewport is covered by both copies at the seam.
          const scroll = worldScroll % MAP_WIDTH;
          ctx.fillStyle = '#162c3c';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
          if (scene.base) drawParallax(ctx, scene.base, worldScroll, 0.18);
          if (scene.scenery) drawParallax(ctx, scene.scenery, worldScroll, 0.38);
          if (scene.terrain) {
            ctx.drawImage(scene.terrain, -scroll, 0);
            ctx.drawImage(scene.terrain, MAP_WIDTH - scroll, 0);
          }

          const groundColumn = Math.floor((scroll + WIDTH / 2) / TILE) % scene.groundY.length;
          const ground = scene.groundY[groundColumn] ?? footY ?? 216;
          const nextGround = scene.groundY[(groundColumn + 1) % scene.groundY.length] ?? ground;
          footY ??= ground;
          const distanceToEdge = TILE - ((scroll + WIDTH / 2) % TILE);
          const approachingStep = nextGround < ground - 8 && distanceToEdge < 19;
          if (reactionRequestRef.current !== seenReactionRequest) {
            seenReactionRequest = reactionRequestRef.current;
            reactionStarted = tapSprite ? now : null;
          }
          if (!jump && (animation === 'walk' || chestMode) && (Math.abs(ground - footY) > 8 || approachingStep)) {
            const target = approachingStep ? nextGround : ground;
            jump = { start: now, from: footY, to: target, height: Math.max(22, Math.abs(target - footY) * .8) };
          } else if (!jump && animation === 'jump' && elapsed - lastAutoJump > jumpDuration + 500) {
            jump = { start: now, from: footY, to: ground, height: 40 };
            lastAutoJump = elapsed;
          }
          let jumping = false;
          let jumpProgress = 0;
          if (jump) {
            jumpProgress = Math.min(1, (now - jump.start) / jumpDuration);
            footY = jump.from + (jump.to - jump.from) * jumpProgress
              - jump.height * 4 * jumpProgress * (1 - jumpProgress);
            jumping = jumpProgress < 1;
            if (!jumping) jump = null;
          } else {
            footY += (ground - footY) * .32;
          }
          if (chestMode && chestStarted === null && now >= chestRestUntil && !jump
            && Math.abs(ground - footY) < 8 && chestWorld - worldScroll <= WIDTH / 2 + 44) {
            chestStarted = now;
          }

          const reactionElapsed = reactionStarted === null ? -1 : now - reactionStarted;
          const reacting = tapSprite && tapAnimation && reactionElapsed >= 0 && reactionElapsed < reactionDuration;
          if (reactionStarted !== null && reactionElapsed >= reactionDuration) {
            reactionStarted = null;
            if (animation !== 'go_sleep') previewStarted = now;
          }
          const useJumpSprite = jumping && jumpSprite && jumpAnimation;
          const takingChest = chestMode && chestStarted !== null;
          const sprite = reacting ? tapSprite : useJumpSprite ? jumpSprite : animation === 'jump' || (chestMode && !takingChest) ? walkSprite : selectedSprite;
          const asset = reacting ? tapAnimation : useJumpSprite ? jumpAnimation : animation === 'jump' || (chestMode && !takingChest) ? walkAnimation : selectedAnimation;
          const frames = Math.max(1, asset.frames);
          const sleepLoopStart = Math.min(11, frames - 1);
          if (animation === 'go_sleep') {
            if (reacting) lastSleepAdvance = now;
            else if (now - lastSleepAdvance >= SLEEP_FRAME_DURATION) {
              sleepFrameIndex = sleepFrameIndex + 1 < frames ? sleepFrameIndex + 1 : sleepLoopStart;
              lastSleepAdvance = now;
            }
          }
          const previewFrame = Math.floor((now - previewStarted) / FRAME_DURATION);
          const index = reacting
            ? Math.min(frames - 1, Math.floor(reactionElapsed / FRAME_DURATION))
            : useJumpSprite
              ? Math.min(frames - 1, Math.floor((now - jump!.start) / jumpFrameDuration))
            : takingChest
              ? Math.min(frames - 1, Math.floor((now - chestStarted!) / FRAME_DURATION))
              : animation === 'go_sleep'
                ? sleepFrameIndex
                : previewFrame % frames;
          const chestFrame = takingChest ? Math.floor((now - chestStarted!) / FRAME_DURATION) : -1;
          let liftedChest: { x: number; bottom: number } | null = null;
          if (chestMode && chestSprite && now >= chestRestUntil && chestWorld - worldScroll < WIDTH + 55 && chestFrame < 6) {
            const chestX = chestWorld - worldScroll;
            const chestColumn = Math.floor(((chestWorld % MAP_WIDTH) + MAP_WIDTH) % MAP_WIDTH / TILE) % scene.groundY.length;
            const chestGround = scene.groundY[chestColumn] ?? ground;
            if (chestFrame >= 3) {
              const lift = Math.min(1, (chestFrame - 2) / 3);
              liftedChest = { x: chestX + (WIDTH / 2 - chestX) * lift, bottom: chestGround + (footY - 95 - chestGround) * lift };
            } else {
              ctx.drawImage(chestSprite, Math.round(chestX - chestSprite.width), chestGround - chestSprite.height * 2,
                chestSprite.width * 2, chestSprite.height * 2);
            }
          }
          // A visible hamster is roughly 24px inside its padded 128px frame.
          // Render it near two 32px terrain tiles tall, as in the game.
          const spriteScale = 2.2;
          const x = (WIDTH - asset.frameWidth * spriteScale) / 2;
          ctx.drawImage(sprite, index * asset.frameWidth, 0, asset.frameWidth, asset.frameHeight,
            x, footY - asset.frameHeight * spriteScale,
            asset.frameWidth * spriteScale, asset.frameHeight * spriteScale);
          if (liftedChest && chestSprite) {
            ctx.drawImage(chestSprite, Math.round(liftedChest.x - chestSprite.width), Math.round(liftedChest.bottom - chestSprite.height * 2),
              chestSprite.width * 2, chestSprite.height * 2);
          }
          frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);
      })
      .catch(() => { if (!cancelled) setFailedKey(requestKey); });

    return () => { cancelled = true; cancelAnimationFrame(frameId); };
  }, [map, skin, name, animation, requestKey]);

  useEffect(() => {
    if (reactionTrigger > 0) reactionRequestRef.current += 1;
  }, [reactionTrigger]);

  return (
    <button className="expedition-scene" type="button" aria-label={`${name} - ${map.name} - ${reactionLabel}`} onClick={() => { reactionRequestRef.current += 1; }}>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      {failedKey === requestKey && <span className="expedition-scene-error">Sprite unavailable</span>}
    </button>
  );
}
