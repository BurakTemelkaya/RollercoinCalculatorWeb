export type HamsterAnimationAction = 'walk' | 'jump' | 'tap_reaction' | 'go_sleep' | 'take_chest' | 'win_loop';

export interface HamsterAnimation {
  path: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
}

export interface HamsterSkin {
  level: number;
  walk: string | null;
  frames: number;
  jump: string | null;
  jumpFrames: number;
  frameWidth: number;
  frameHeight: number;
  idle: string | null;
  animations: Partial<Record<HamsterAnimationAction, HamsterAnimation>>;
}

export interface LocalizedText {
  en: string;
  tr?: string;
  ru?: string;
  de?: string;
  es?: string;
  fr?: string;
  pt?: string;
  id?: string;
  zh?: string;
  cs?: string;
  [key: string]: string | undefined;
}

export interface HamsterTrait {
  code: string;
  text: LocalizedText;
  icon: string | null;
}

export interface HamsterBuilderOption {
  code: string;
  name: LocalizedText;
  icon: string | null;
  levels?: { level: number | 'basic'; value: string }[];
}

export interface HamsterBuilderSlot {
  title: LocalizedText;
  builds: { buff: HamsterBuilderOption; debuff: HamsterBuilderOption | null }[];
}

export interface Hamster {
  slug: string;
  name: string;
  generation: number;
  order: number;
  stats: { health: number; strength: number; luck: number };
  abilities: HamsterTrait[];
  builderSlots: HamsterBuilderSlot[];
  ultimate: HamsterTrait | null;
  ultimateChargePoints: number | null;
  skins: HamsterSkin[];
}

export interface HamsterSet {
  slug: string;
  order: number;
  name: LocalizedText;
  members: string[];
  icon: string | null;
  completion: {
    text: LocalizedText;
    rewardRlt: string;
  };
  levels: {
    level: number;
    requiredMembers: number;
    totalMembers: number;
    text: LocalizedText;
    rewardRlt: string;
  }[];
}

