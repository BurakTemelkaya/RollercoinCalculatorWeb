// Values from RollerCoin's Ai/create/update in t0lGOzvM4YmKWyGVJPRDy.js.
export const EXPEDITION_ANIMATION = {
  stepMs: 1000 / 60,
  roadSpeed: 2,
  walkFrameMs: 1000 / 20,
  reactionFrameMs: 1000 / 20,
  jumpFrameMs: 1000 / 10,
  actionFrameMs: 1000 / 10,
  spriteScale: 2,
  jumpFrames: [1, 2, 3, 4, 5],
  sleepLoopFrames: [16, 17, 18, 19, 20, 21, 22, 23],
  chestLiftOffsets: [0, 0, 0, 100, 130, 60],
} as const;

export interface TerrainMotion {
  distance: number;
  state: 'walk' | 'jumpUp' | 'jumpDown';
  frame: number;
  frameElapsed: number;
  offsetY: number;
  destinationHeight: number | null;
}

export function createTerrainMotion(distance: number): TerrainMotion {
  return { distance, state: 'walk', frame: 0, frameElapsed: 0, offsetY: 0, destinationHeight: null };
}

export function resetTerrainMotion(motion: TerrainMotion) {
  motion.state = 'walk';
  motion.frame = 0;
  motion.frameElapsed = 0;
  motion.offsetY = 0;
  motion.destinationHeight = null;
}

export function terrainPosition(distance: number, heights: number[], viewportWidth: number, tile: number) {
  // The source samples the road a quarter tile behind the hamster's center.
  const column = Math.floor((distance + viewportWidth / 2 - tile / 4) / tile) % heights.length;
  const ground = heights[column] ?? 216;
  return { ground, nextGround: heights[(column + 1) % heights.length] ?? ground };
}

export function stepTerrainMotion(motion: TerrainMotion, heights: number[], viewportWidth: number, tile: number,
  maxDistance = Infinity) {
  const profile = EXPEDITION_ANIMATION;
  motion.frameElapsed += profile.stepMs;
  const frameMs = motion.state === 'walk' ? profile.walkFrameMs : profile.jumpFrameMs;
  if (motion.frameElapsed + 1e-6 >= frameMs) {
    motion.frameElapsed -= frameMs;
    if (motion.state === 'walk') motion.frame += 1;
    else if (motion.frame < profile.jumpFrames.length - 1) {
      motion.frame += 1;
      // Phaser's update event uses one-based sequence indices. Starting a new
      // animation does not emit that event, so its first pose retains dy = 0.
      const sourceIndex = motion.frame + 1;
      const offsets = motion.state === 'jumpUp'
        ? [0, -tile / 3 * 2, -tile * 1.2, -tile * 1.5, -tile * 1.4, -tile * 1.2]
        : [0, -4, -6, -8, -8, -4];
      motion.offsetY = offsets[sourceIndex];
    }
  }
  motion.distance = Math.min(maxDistance, motion.distance + profile.roadSpeed);
  const { ground, nextGround } = terrainPosition(motion.distance, heights, viewportWidth, tile);
  if (motion.destinationHeight !== null && ground === motion.destinationHeight) resetTerrainMotion(motion);
  const nextState = ground > nextGround ? 'jumpUp' : ground < nextGround ? 'jumpDown' : null;
  if (nextState && motion.state !== nextState) {
    motion.state = nextState;
    motion.frame = 0;
    motion.frameElapsed = 0;
    motion.destinationHeight = nextGround;
  }
  return ground + motion.offsetY;
}
