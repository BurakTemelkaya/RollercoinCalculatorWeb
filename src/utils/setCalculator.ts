import { SETS_DATA, RollercoinSet } from '../data/sets';
import { RollercoinRoomResponse } from '../types/room';

export interface SetBonusResult {
    percent_power: number;
    bonus_power: number;
}

// Simple heuristic mapping to map miner name keywords to set titles
// Since the API doesn't provide the exact set ID for a miner, we try to guess it.
const SET_KEYWORD_MAP: Record<string, string> = {
    'radio': 'Radio Set',
    'power-up': 'Power-Up Set',
    'power up': 'Power-Up Set',
    'silver': 'Silver Farm Set',
    'bronze': 'Bronze Farm Set',
    'royal': 'Royal Set',
    'note': 'Royal Set', // Royal Note, Spade Note, Heart Note, Club Note
    'designer': 'Designer Set',
    'hamior': 'Designer Set',
    'hames': 'Designer Set',
    'hamel': 'Designer Set',
    'hamuis': 'Designer Set',
    'asgardian': 'Asgardian Set',
    'runner': 'Runners Set',
    'globe': 'Globes Set',
    'bros': 'Super Bros Set',
    'alien': 'Alien Set',
    'imperial': 'IMPERIAL Set',
    'beer': 'Beer Pack Set',
    'golden': 'Golden Farm Set', // GoldenCarrot, GoldenTomato, etc.
};

export function guessSetByMinerName(minerName: string): RollercoinSet | null {
    const lowerName = minerName.toLowerCase();
    
    // Check keywords
    for (const [keyword, setTitle] of Object.entries(SET_KEYWORD_MAP)) {
        if (lowerName.includes(keyword)) {
            const set = SETS_DATA.find(s => s.title.en === setTitle);
            if (set) return set;
        }
    }

    // Direct match check (fallback)
    for (const set of SETS_DATA) {
        if (lowerName.includes(set.title.en.toLowerCase().replace(' set', ''))) {
            return set;
        }
    }

    return null;
}

export function guessSetByRackName(rackName: string): RollercoinSet | null {
    const lowerName = rackName.toLowerCase();
    
    // Check keywords
    for (const [keyword, setTitle] of Object.entries(SET_KEYWORD_MAP)) {
        if (lowerName.includes(keyword)) {
            const set = SETS_DATA.find(s => s.title.en === setTitle);
            if (set) return set;
        }
    }

    // Direct match check (fallback)
    for (const set of SETS_DATA) {
        if (lowerName.includes(set.title.en.toLowerCase().replace(' set', ''))) {
            return set;
        }
    }

    return null;
}

export function calculateSetBonuses(roomData: RollercoinRoomResponse): Map<string, SetBonusResult> {
    const rackBonuses = new Map<string, SetBonusResult>();

    if (!roomData || !roomData.miners) {
        return rackBonuses;
    }

    // Group `is_in_set: true` miners by rack
    const rackMiners = new Map<string, any[]>();
    const uniqueMinerIdsByRack = new Map<string, Set<string>>();

    for (const miner of roomData.miners) {
        if (miner.is_in_set && miner.placement && miner.placement.user_rack_id) {
            const rackId = miner.placement.user_rack_id;
            
            if (!rackMiners.has(rackId)) {
                rackMiners.set(rackId, []);
                uniqueMinerIdsByRack.set(rackId, new Set<string>());
            }
            
            // Only count UNIQUE miners for set completion
            const uniqueSet = uniqueMinerIdsByRack.get(rackId)!;
            if (!uniqueSet.has(miner.miner_id)) {
                uniqueSet.add(miner.miner_id);
                rackMiners.get(rackId)!.push(miner);
            }
        }
    }

    // Evaluate sets for each rack
    for (const [rackId, miners] of rackMiners.entries()) {
        const uniqueCount = miners.length;
        if (uniqueCount === 0) continue;

        // Try to guess the set using the first miner on the rack
        // Assuming all set miners on a rack belong to the same set
        const guessedSet = guessSetByMinerName(miners[0].name);

        if (guessedSet && guessedSet.levels) {
            // Find the highest level achieved based on unique count
            // Sort levels by condition_amount descending to find the highest met condition
            const sortedLevels = [...guessedSet.levels].sort((a, b) => b.condition_amount - a.condition_amount);
            
            const achievedLevel = sortedLevels.find(l => uniqueCount >= l.condition_amount);
            
            if (achievedLevel) {
                rackBonuses.set(rackId, {
                    percent_power: achievedLevel.percent_power || 0,
                    bonus_power: achievedLevel.bonus_power || 0
                });
            }
        }
    }

    return rackBonuses;
}
