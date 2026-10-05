import { HAMSTER_BESTIARY } from './hamsterBestiary';
import type { Hamster } from '../types/hamster';

// Verified official articles, including season posts that introduce a hamster.
// Keep editorial explanations separate from the imported game catalog.
const ARTICLE_PATHS: Record<string, string> = {
  'mr-jack': 'rollercoin-8th-anniversary',
  'sir-catch-a-lot': 'it-opens-at-the-close',
  'lucky-red': 'lunar-gallop-2026',
  partello: 'partello-worker-hamster',
  kitsumi: 'story-of-kitsumi',
  'hammy-hooks': 'meet-hammy-hooks',
  goodncle: 'meet-uncle-azoth',
  badncle: 'meet-uncle-azoth',
  'uncle-azoth': 'meet-uncle-azoth',
  'joga-bonito': 'meet-joga-bonito',
  'eliza-bit': 'new-season-the-lost-treasure',
  'captain-jack-pot': 'pirates-of-the-oopsea-captain-jack-pot-arrives',
  'davy-coins': 'meet-davy-coins',
  'gordon-hamzy': 'meet-gordon-hamzy',
  gfeast: 'meet-gfeast-hero-hamster',
  solaire: 'new-season-rollerhouse-of-horrors',
  'lady-minerra': 'meet-lady-minerra',
  cuscuz: 'meet-cuscuz-hero-hamster',
};

export function officialHamsterArticle(slug: string): string | undefined {
  const path = ARTICLE_PATHS[slug] ?? (HAMSTER_BESTIARY[slug] ? `hamster-bestiary-${HAMSTER_BESTIARY[slug].path}` : undefined);
  return path ? `https://rollercoin.com/blog/${path}` : undefined;
}

export interface AbilityGuide {
  description: string;
  example?: string;
  label?: string;
  params?: Record<string, string | number>;
  source?: string;
}

const PASSIVES: Record<string, string> = {
  experience: 'experience', survival: 'survival', rest_time: 'rest', relax_time: 'rest',
  extra_reward: 'loot', extra_loot: 'loot', expedition_time: 'duration', set_expedition_time: 'duration',
  return_to_work: 'overtime', influencer: 'influencer', buyback_discount: 'buyback',
  remote_bonus: 'remoteBonus', remote_power: 'remotePower', rlt_chest: 'rltChest',
  season_xp_chest: 'seasonXpChest', keep_it_going: 'keepGoing',
  rest_relay: 'restRelay', charge_relay: 'chargeRelay', games_boost: 'gamesBoost',
};

const ULTIMATES: Record<string, string> = {
  all_stats_become_100: 'boostMode', boost_mode_all_stats_become_100: 'boostMode',
  x3_minus_5_chests_if_it_survives: 'chestsMultiplier', chests_multiplier: 'overchargedChests',
  crypto_reward_if_it_survives: 'cryptoChest', survives_no_matter_what: 'sureWin',
  brings_extra_common_parts_if_it_survives: 'partsChest',
  smart_study_no_cooldown_and_plus_1_stat_point_if_she_survives: 'smartStudy',
  speed_ups_chests: 'speedChest',
  high_risk_high_reward_x2_rewards_and_xp_x1_5_duration_no_rest_failed_runs_keep_b: 'highRisk',
  converts_expedition_rewards_into_rlt: 'lootConversion', loot_conversion: 'overchargedConversion',
  pirate_luck: 'pirateLuck', hamsters_chest: 'hamstersChest', remote_power: 'remotePowerUltimate',
  remote_bonus: 'remoteBonusUltimate',
};

export function hamsterAbilityGuide(hamster: Hamster, code: string, ultimate = false): AbilityGuide | undefined {
  let key = (ultimate ? ULTIMATES : PASSIVES)[code];
  if (!key) return undefined;
  if (key === 'influencer' && hamster.slug === 'eliza-bit') key = 'influencerShared';
  const guide: AbilityGuide = {
    description: key,
    source: officialHamsterArticle(hamster.slug),
    params: { charge: hamster.ultimateChargePoints ?? 0, name: hamster.name },
  };
  if (ultimate) guide.label = key;
  if (code === 'survival') guide.source = 'https://rollercoin.com/blog/dev-diaries-vol18';
  if (code === 'influencer' && hamster.slug !== 'eliza-bit') guide.source = 'https://rollercoin.com/blog/mamita-sale';
  if (code === 'return_to_work') guide.source = 'https://rollercoin.com/blog/the-great-crypto-heist';
  if (hamster.slug === 'kitsumi' && code === 'remote_bonus') guide.example = 'remoteBonus';
  if (hamster.slug === 'solaire' && ultimate) guide.example = 'overchargedChests';
  if (hamster.slug === 'cuscuz' && ultimate) guide.example = 'cuscuzRemoteBonus';
  if (hamster.slug === 'plague-dancer' && ultimate) {
    guide.description = 'plagueChests';
    guide.source = 'https://rollercoin.com/blog/plague-dancer-pumpkin-origin';
  }
  return guide;
}
