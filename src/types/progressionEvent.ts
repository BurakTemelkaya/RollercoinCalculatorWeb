/**
 * Progression Event Types
 * 
 * Type definitions for the Progression Event feature
 */

// API Response (top-level) — new flat format
export interface ProgressionEventResponse {
  id: string;
  name: string;
  endDate: string;
  createdDate?: string;
  totalPoint?: number;
  rewards: ApiReward[];
  levels: ApiLevel[];
  multipliers?: ApiMultiplier[];
  tasks?: ApiTask[];
}

// List item returned by GetList endpoint
export interface ProgressionEventListItem {
  id: string;
  name: string;
  createdDate: string;
  endDate: string;
  totalPoint?: number;
}

// API reward item (flat, camelCase)
export interface ApiReward {
  id: string;
  requiredLevel: number;
  rewardType: RewardType;
  amount: number;
  currency: string;
  itemId: string | null;
  minerId: string | null;
  ttlTime: number;
  itemName: string | null;
  itemPreviewUrl: string | null;
  itemBoxUrl: string | null;
  itemCoverUrl: string | null;
  rackCapacity: number | null;
  miner: ApiMiner | null;
}

// API miner item (nested in reward, camelCase)
export interface ApiMiner {
  id: string;
  name: string;
  fileName: string;
  imageVersion: number;
  level: number;
  percent: number; // bonus percentage (divide by 100 for display)
  power: number;   // Gh/s
  width: number;
}

// API level item (flat, camelCase)
export interface ApiLevel {
  id: string;
  level: number;
  levelXp: number;
  requiredXp: number;
}

// API multiplier item (flat, camelCase)
export interface ApiMultiplier {
  id: string;
  multiplier: number;
  amount: number;
  title: string;
}

// API task item (flat, camelCase)
export interface ApiTask {
  id: string;
  amount: number;
  title: string;
  type: string;
  xpReward: number;
  xpType: string;
}

// === Internal types (used by the component) ===

export interface ProgressionReward {
  id: string;
  item_id: string | null;
  amount: number;
  currency: string;
  ttl_time: number;
  required_level: number;
  type: RewardType;
  title: LocalizedText;
  description: LocalizedText;
  range_count: { min: number; max: number };
  item_media_url?: string | null;
  box_image_url?: string | null;
  cover_image_url?: string | null;
  rack_capacity?: number | null;
  item?: MinerItem | RackItem | UtilityItem | BatteryItem | MutationComponentItem | MysteryBoxItem | TrophyItem | HatItem;
}

export type RewardType =
  | 'power'
  | 'money'
  | 'season_pass_xp'
  | 'battery'
  | 'miner'
  | 'rack'
  | 'utility_item'
  | 'mutation_component'
  | 'mystery_box'
  | 'trophy'
  | 'hat';

export interface LocalizedText {
  en: string;
  cn: string;
  [key: string]: string;
}

export interface MinerItem {
  _id: string;
  power: number;
  width: number;
  name: LocalizedText;
  description: LocalizedText;
  created_by_title: { link: string; text: string };
  level: number;
  type: string; // 'basic' | 'merge'
  filename: string;
  image_version?: number;
  frames_data: { frame_width: number; frame_height: number; frames_count?: number };
  is_can_be_sold_on_mp: boolean;
  bonus: number;
  is_in_set: boolean;
}

export interface RackItem {
  name: LocalizedText;
  description: LocalizedText;
  _id: string;
  capacity: number;
  is_can_be_sold_on_mp: boolean;
  is_in_set: boolean;
  filename?: string;
}

export interface UtilityItem {
  name: LocalizedText;
  description: LocalizedText;
  media: { preview_url: string };
  _id: string;
  type: string;
}

export interface BatteryItem {
  description: LocalizedText;
  _id: string;
  level: number;
}

export interface MutationComponentItem {
  _id: string;
  name: LocalizedText;
  rarity_group?: {
    _id: string;
    title: LocalizedText;
    base_color_hex: string;
    sort: number;
  };
  rarity_color_hex?: string;
}

export interface MysteryBoxItem {
  _id: string;
  title: LocalizedText;
  media?: {
    box_url?: string;
    cover_url?: string;
    box_image_url?: string;
  };
}

export interface TrophyItem {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
  file_name: string;
}

export interface HatItem {
  _id: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface LevelConfig {
  level: number;
  level_xp: number;
  required_xp: number;
}

// Multiplier data (internal, snake_case for component compatibility)
export interface MultiplierData {
  id: string;
  multiplier: number;
  amount: number;
  title: string;
}

// Task data (internal, snake_case for component compatibility)
export interface TaskData {
  id: string;
  amount: number;
  title: string;
  type: string;
  xp_reward: number;
  xp_type: string;
}

// Currency discount from backend API
export interface CurrencyDiscount {
    id: string;
    currencyId: number;
    amount: number;
    createdDate: string;
    endDate: string;
    updatedDate: string | null;
}

// Box price options (fixed)
export const BOX_PRICE_OPTIONS = [1.45, 3.45, 8.95] as const;

// Discount options (fixed)
export const DISCOUNT_OPTIONS = [60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10] as const;

// Event difficulty constants
export const EVENT_CONSTANTS = {
  GAME_DIFFICULTY: 500,
  XP_PER_RLT: 1000,
  MULTIPLIER_STEP_RLT: 10,
  MULTIPLIER_DURATION_HOURS: 1,
  MARKETPLACE_RATE: 150,
  FEE_RATE: 0.05,
} as const;
