// Individual stat ceilings and rest periods from RollerCoin's official Bestiary.
// Its older survival bonuses predate Dev Diaries Vol.18, so they are not used in the calculator.
export interface BestiaryEntry {
  path: string;
  maxStats?: { health: number; strength: number; luck: number };
  restHours?: number;
}

export const HAMSTER_BESTIARY: Record<string, BestiaryEntry> = {
  'the-hamster': { path: 'thehamster', maxStats: { health: 69, strength: 59, luck: 69 }, restHours: 24 },
  cowham: { path: 'cowham', maxStats: { health: 89, strength: 79, luck: 89 }, restHours: 24 },
  guile: { path: 'guile', maxStats: { health: 99, strength: 79, luck: 69 }, restHours: 24 },
  'big-daddy': { path: 'big-daddy', maxStats: { health: 99, strength: 100, luck: 99 }, restHours: 24 },
  'the-dracula': { path: 'the-dracula', maxStats: { health: 59, strength: 99, luck: 100 }, restHours: 24 },
  'naughty-claus': { path: 'naughty-claus', maxStats: { health: 100, strength: 94, luck: 100 }, restHours: 24 },
  uncle: { path: 'uncle', maxStats: { health: 100, strength: 100, luck: 79 }, restHours: 24 },
  'birthday-bob': { path: 'birthday-bob', maxStats: { health: 79, strength: 79, luck: 59 }, restHours: 23 },
  valkirita: { path: 'valkirita', maxStats: { health: 100, strength: 100, luck: 74 }, restHours: 24 },
  'banjo-walker': { path: 'banjo-walker', maxStats: { health: 100, strength: 79, luck: 100 }, restHours: 24 },
  'dusty-mcuncle': { path: 'dusty-mcuncle', maxStats: { health: 100, strength: 100, luck: 89 }, restHours: 24 },
  mamita: { path: 'mamita', maxStats: { health: 100, strength: 79, luck: 100 }, restHours: 24 },
  'plague-dancer': { path: 'plague-dancer', maxStats: { health: 74, strength: 100, luck: 100 } },
  anomaly: { path: 'anomaly' },
  'lord-hexron': { path: 'lord-hexron' },
};

export function bestiaryUrl(path: string): string {
  return `https://rollercoin.com/blog/hamster-bestiary-${path}`;
}
