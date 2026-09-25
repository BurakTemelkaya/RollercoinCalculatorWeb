import type { Hamster } from '../types/hamster';

export interface ChanceOptions {
  level: number;
  setBonus?: number;
  builderSurvival?: boolean;
  ultimate?: boolean;
  extraStatPoints?: number;
}

export function hasMaxStatsUltimate(hamster: Hamster): boolean {
  return hamster.ultimate?.code === 'all_stats_become_100' || hamster.ultimate?.code === 'boost_mode_all_stats_become_100';
}

export function hasSmartStudy(hamster: Hamster): boolean {
  return hamster.ultimate?.code === 'smart_study_no_cooldown_and_plus_1_stat_point_if_she_survives';
}

export function totalHamsterStats(hamster: Hamster, level: number, ultimate = false, extraStatPoints = 0): number {
  if (ultimate && hasMaxStatsUltimate(hamster)) return 300;
  const startingLevel = hamster.skins[0]?.level ?? 1;
  const availableSmartStudyPoints = 300 - (hamster.stats.health + hamster.stats.strength + hamster.stats.luck);
  const smartStudyPoints = hasSmartStudy(hamster) ? Math.min(availableSmartStudyPoints, Math.max(0, Math.floor(extraStatPoints))) : 0;
  return Math.min(300, hamster.stats.health + hamster.stats.strength + hamster.stats.luck + Math.max(0, level - startingLevel) + smartStudyPoints);
}

// This quadratic reproduces every published stat/chance pair in Dev Diaries Vol.18.
// RollerCoin publishes the examples, but not this equation explicitly.
export function basicSurvivalChance(totalStats: number): number {
  return Math.min(90, Math.max(20, 20 + 70 * ((totalStats - 30) / 270) ** 2));
}

export function difficultyInfluence(difficulty: number): number {
  return 5 - (difficulty - 1) * (10 / 9);
}

export function abilitySurvivalBonus(hamster: Hamster, level: number, builderSurvival = false): number {
  const passive = hamster.abilities
    .filter(ability => ability.code === 'survival')
    .reduce((sum, ability) => sum + Number(ability.text.en?.match(/[+-]?\d+(?:\.\d+)?/)?.[0] ?? 0), 0);
  if (!builderSurvival) return passive;
  const option = hamster.builderSlots.flatMap(slot => slot.builds.map(build => build.buff)).find(buff => buff.code === 'survival');
  if (!option) return passive;
  const rank = option.levels?.filter(item => item.level === 'basic' || item.level <= level).at(-1);
  const value = rank?.value ?? option.name.en;
  return passive + Number(value.match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
}

export function expeditionSurvivalChance(hamster: Hamster, difficulty: number, options: ChanceOptions): number {
  if (options.ultimate && hamster.slug === 'lucky-red') return 100;
  const stats = totalHamsterStats(hamster, options.level, options.ultimate, options.extraStatPoints);
  return Math.min(100, Math.max(0, basicSurvivalChance(stats)
    + difficultyInfluence(difficulty)
    + abilitySurvivalBonus(hamster, options.level, options.builderSurvival)
    + (options.setBonus ?? 0)));
}
