/**
 * Progression Event Types
 * 
 * Type definitions for the Progression Event feature
 */

// API Response (top-level)
export interface ProgressionEventResponse {
  id: string;
  name: string;
  endDate: string;
  data: string; // JSON string containing ProgressionEventData
  multiplierData?: string; // JSON string containing MultiplierData[]
  taskData?: string; // JSON string containing TaskData[]
}

// Parsed inner data
export interface ProgressionEventData {
  event: ProgressionEventInfo;
  rewards: ProgressionReward[];
  levels_config: LevelConfig[];
}

export interface MultiplierData {
  id: string;
  multiplier: number;
  amount: number;
  title: LocalizedText;
}

export interface TaskData {
  id: string;
  amount: number;
  title: LocalizedText;
  type: string;
  xp_reward: number;
  xp_type: string;
}

export interface ProgressionEventInfo {
  _id: string;
  max_xp: number;
  max_multiplier: number;
  max_level: number;
  tag: { text: string; color: string; text_color: string };
  progression_event_type: string;
  end_date: string;
  last_updated: number;
  description: LocalizedText;
  title: LocalizedText;
}

export interface LocalizedText {
  en: string;
  cn: string;
  [key: string]: string;
}

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
  item?: MinerItem | RackItem | UtilityItem | BatteryItem;
}

export type RewardType = 'power' | 'money' | 'season_pass_xp' | 'battery' | 'miner' | 'rack' | 'utility_item';

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

export interface LevelConfig {
  level: number;
  level_xp: number;
  required_xp: number;
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
