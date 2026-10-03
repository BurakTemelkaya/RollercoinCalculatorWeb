import { useEffect, useRef, useState } from 'react';
import type { ExpeditionMap } from '../data/expeditionMaps';
import type { HamsterAnimationAction, HamsterSkin } from '../types/hamster';
import { hamsterAssetUrl } from '../utils/hamsterAssets';
import { createTerrainMotion, EXPEDITION_ANIMATION, resetTerrainMotion, stepTerrainMotion, terrainPosition } from '../utils/expeditionAnimation';

const WIDTH = 960;
const HEIGHT = 320;
const TILE = 32;
const MAP_WIDTH = 90 * TILE;
const { reactionFrameMs: REACTION_FRAME_DURATION,
  actionFrameMs: ACTION_FRAME_DURATION, spriteScale: SPRITE_SCALE,
  chestLiftOffsets: CHEST_LIFT_OFFSETS, sleepLoopFrames: SLEEP_LOOP_FRAMES } = EXPEDITION_ANIMATION;

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
    ctx.drawImage(image, x, 0, width, image.naturalHeight * SPRITE_SCALE);
  }
}

interface Props {
  map: ExpeditionMap;
  skin: HamsterSkin;
  name: string;
  animation: HamsterAnimationAction;
  reactionLabel: string;
}

export default function ExpeditionScene({ map, skin, name, animation, reactionLabel }: Props) {
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
        let sleepLoopIndex = -1;
        let lastSleepAdvance = started;
        let reactionStarted: number | null = null;
        let lastFrame = started;
        let stepAccumulator = 0;
        let worldScroll = progressRef.current.mapId === map.id && progressRef.current.name === name
          ? progressRef.current.distance : 0;
        progressRef.current = { mapId: map.id, name, distance: worldScroll };
        const motion = createTerrainMotion(worldScroll);
        let footY = terrainPosition(worldScroll, scene.groundY, WIDTH, TILE).ground;
        const placeChest = () => {
          // Source placement starts beyond the right edge, then finds flat road.
          const firstColumn = Math.floor(worldScroll / TILE) + Math.floor(WIDTH / TILE) + 2;
          // Like RollerCoin, place the chest on two adjacent tiles of equal height.
          for (let offset = 0; offset < scene.groundY.length; offset += 1) {
            const column = (firstColumn + offset) % scene.groundY.length;
            if (scene.groundY[column] !== undefined
              && scene.groundY[column] === scene.groundY[(column + 1) % scene.groundY.length]) {
              return (firstColumn + offset + .5) * TILE;
            }
          }
          return worldScroll + WIDTH + TILE * 2;
        };
        let chestWorld = placeChest();
        let chestStarted: number | null = null;
        let chestFrameIndex = 0;
        let lastChestAdvance = started;
        let chestRestUntil = 0;
        const reactionDuration = Math.max(1, tapAnimation?.frames ?? 1) * REACTION_FRAME_DURATION;
        const chestFrames = Math.max(1, Math.floor(selectedSprite.naturalWidth / selectedAnimation.frameWidth));
        const sleepFrames = Math.max(1, Math.floor(selectedSprite.naturalWidth / selectedAnimation.frameWidth));
        const availableSleepLoopFrames = SLEEP_LOOP_FRAMES.filter(frame => frame < sleepFrames);
        const sleepLoopFrames = availableSleepLoopFrames.length ? availableSleepLoopFrames : [sleepFrames - 1];
        if (animation === 'tap_reaction') reactionStarted = started;
        const animate = (now: number) => {
          const delta = Math.min(now - lastFrame, 50);
          lastFrame = now;
          const takingChestBeforeUpdate = chestMode && chestStarted !== null;
          const stopped = animation === 'go_sleep' || animation === 'win_loop' || takingChestBeforeUpdate;
          if (reactionRequestRef.current !== seenReactionRequest) {
            seenReactionRequest = reactionRequestRef.current;
            // RollerCoin ignores pointer reactions during jumps and stopped states.
            if (!stopped && motion.state === 'walk' && reactionStarted === null) {
              reactionStarted = tapSprite ? now : null;
            }
          }
          // Stop with the hamster and chest centered at the same world position.
          const moving = !stopped && (!chestMode || now >= chestRestUntil);
          if (moving) {
            stepAccumulator += delta;
            while (stepAccumulator + 1e-6 >= EXPEDITION_ANIMATION.stepMs) {
              footY = stepTerrainMotion(motion, scene.groundY, WIDTH, TILE,
                chestMode ? chestWorld - WIDTH / 2 : Infinity);
              stepAccumulator -= EXPEDITION_ANIMATION.stepMs;
            }
            worldScroll = motion.distance;
            progressRef.current.distance = worldScroll;
          } else {
            stepAccumulator = 0;
          }
          // Repeat the full road canvas; the viewport is covered by both copies at the seam.
          const scroll = worldScroll % MAP_WIDTH;
          ctx.fillStyle = '#162c3c';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
          if (scene.base) drawParallax(ctx, scene.base, worldScroll, 0);
          if (scene.scenery) drawParallax(ctx, scene.scenery, worldScroll, 0.5);
          if (scene.terrain) {
            ctx.drawImage(scene.terrain, -scroll, 0);
            ctx.drawImage(scene.terrain, MAP_WIDTH - scroll, 0);
          }

          const { ground } = terrainPosition(worldScroll, scene.groundY, WIDTH, TILE);
          if (chestMode && chestStarted === null && now >= chestRestUntil && chestWorld - worldScroll <= WIDTH / 2) {
            resetTerrainMotion(motion);
            footY = ground;
            reactionStarted = null;
            chestStarted = now;
            chestFrameIndex = 0;
            lastChestAdvance = now;
          }
          if (!stopped && motion.state !== 'walk') reactionStarted = null;

          const reactionElapsed = reactionStarted === null ? -1 : now - reactionStarted;
          const reacting = tapSprite && tapAnimation && reactionElapsed >= 0 && reactionElapsed < reactionDuration;
          if (reactionStarted !== null && reactionElapsed >= reactionDuration) {
            reactionStarted = null;
            resetTerrainMotion(motion);
            if (animation !== 'go_sleep') previewStarted = now;
          }
          if (chestMode && chestStarted !== null) {
            if (reacting) lastChestAdvance = now;
            else if (now - lastChestAdvance >= ACTION_FRAME_DURATION) {
              if (chestFrameIndex < chestFrames - 1) chestFrameIndex += 1;
              else {
                chestStarted = null;
                chestRestUntil = now + 350;
                chestWorld = placeChest();
              }
              lastChestAdvance += ACTION_FRAME_DURATION;
            }
          }
          const useJumpSprite = !stopped && motion.state !== 'walk' && jumpSprite && jumpAnimation;
          const takingChest = chestMode && chestStarted !== null;
          const showWalk = !takingChest && animation !== 'go_sleep' && animation !== 'win_loop';
          const sprite = reacting ? tapSprite : useJumpSprite ? jumpSprite : showWalk ? walkSprite : selectedSprite;
          const asset = reacting ? tapAnimation : useJumpSprite ? jumpAnimation : showWalk ? walkAnimation : selectedAnimation;
          const frames = Math.max(1, asset.frames);
          if (animation === 'go_sleep') {
            if (reacting) lastSleepAdvance = now;
            else if (now - lastSleepAdvance >= ACTION_FRAME_DURATION) {
              if (sleepLoopIndex < 0 && sleepFrameIndex < sleepFrames - 1) sleepFrameIndex += 1;
              else {
                // sleepStart finishes once, then sleepLoop repeats without reversing the poses.
                sleepLoopIndex = (sleepLoopIndex + 1) % sleepLoopFrames.length;
                sleepFrameIndex = sleepLoopFrames[sleepLoopIndex];
              }
              lastSleepAdvance += ACTION_FRAME_DURATION;
            }
          }
          const previewFrame = Math.floor((now - previewStarted) / ACTION_FRAME_DURATION);
          const index = reacting
            ? Math.min(frames - 1, Math.floor(reactionElapsed / REACTION_FRAME_DURATION))
            : useJumpSprite
              ? Math.min(frames - 1, EXPEDITION_ANIMATION.jumpFrames[motion.frame])
            : takingChest
              ? chestFrameIndex
              : animation === 'go_sleep'
                ? sleepFrameIndex
                : showWalk ? motion.frame % frames : previewFrame % frames;
          let visibleChest: { x: number; bottom: number } | null = null;
          if (chestMode && chestSprite && now >= chestRestUntil && chestWorld - worldScroll < WIDTH + 55
            && (!takingChest || chestFrameIndex < CHEST_LIFT_OFFSETS.length)) {
            const chestX = chestWorld - worldScroll;
            const chestColumn = Math.floor(((chestWorld % MAP_WIDTH) + MAP_WIDTH) % MAP_WIDTH / TILE) % scene.groundY.length;
            const chestGround = scene.groundY[chestColumn] ?? ground;
            const lift = takingChest ? CHEST_LIFT_OFFSETS[chestFrameIndex] : 0;
            visibleChest = { x: chestX, bottom: lift ? footY - lift * SPRITE_SCALE / 2 : chestGround };
          }
          // A visible hamster is roughly 24px inside its padded 128px frame.
          // Render it near two 32px terrain tiles tall, as in the game.
          const x = (WIDTH - asset.frameWidth * SPRITE_SCALE) / 2;
          ctx.drawImage(sprite, index * asset.frameWidth, 0, asset.frameWidth, asset.frameHeight,
            x, footY - asset.frameHeight * SPRITE_SCALE,
            asset.frameWidth * SPRITE_SCALE, asset.frameHeight * SPRITE_SCALE);
          // The source places chests above the hamster (depth 30 vs 20).
          if (visibleChest && chestSprite) {
            ctx.drawImage(chestSprite, visibleChest.x - chestSprite.width * SPRITE_SCALE / 2,
              visibleChest.bottom - chestSprite.height * SPRITE_SCALE,
              chestSprite.width * SPRITE_SCALE, chestSprite.height * SPRITE_SCALE);
          }
          frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);
      })
      .catch(() => { if (!cancelled) setFailedKey(requestKey); });

    return () => { cancelled = true; cancelAnimationFrame(frameId); };
  }, [map, skin, name, animation, requestKey]);

  return (
    <button className="expedition-scene" type="button" aria-label={`${name} - ${map.name} - ${reactionLabel}`} onClick={() => { reactionRequestRef.current += 1; }}>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      {failedKey === requestKey && <span className="expedition-scene-error">Sprite unavailable</span>}
    </button>
  );
}
