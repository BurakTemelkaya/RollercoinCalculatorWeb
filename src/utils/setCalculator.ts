import { SETS_DATA, RollercoinSet } from '../data/sets';
import { ApiRoomMiner, RollercoinRoomResponse } from '../types/room';

export interface SetBonusResult {
    percent_power: number;
    bonus_power: number;
}

/**
 * Finds a set by checking if the miner's filename exists in the set's miners array.
 * Fallback to checking miner name in case filename is somehow missing.
 */
export function guessSetByMiner(miner: ApiRoomMiner): RollercoinSet | null {
    for (const set of SETS_DATA) {
        if (set.miners) {
            for (const setMiner of set.miners) {
                if (miner.filename && setMiner.filename === miner.filename) {
                    return set;
                }
                // Fallback to name match if filename didn't match (shouldn't happen often)
                if (miner.name && setMiner.title.en === miner.name) {
                    return set;
                }
            }
        }
    }

    return null;
}

/**
 * Kept for backward compatibility, though using guessSetByMiner is much safer.
 */
export function guessSetByMinerName(minerName: string): RollercoinSet | null {
    const lowerName = minerName.toLowerCase();
    
    for (const set of SETS_DATA) {
        if (set.miners) {
            for (const setMiner of set.miners) {
                if (setMiner.title.en.toLowerCase() === lowerName || setMiner.filename.toLowerCase() === lowerName) {
                    return set;
                }
            }
        }
        
        // Direct title check as fallback
        if (lowerName.includes(set.title.en.toLowerCase().replace(' set', ''))) {
            return set;
        }
    }

    return null;
}

/**
 * Finds a set by checking the rack's name or id.
 */
export function guessSetByRackName(rackName: string): RollercoinSet | null {
    const lowerName = rackName.toLowerCase();
    
    for (const set of SETS_DATA) {
        if (set.rack) {
            if (set.rack.title.en.toLowerCase() === lowerName) {
                return set;
            }
        }
        
        // Direct title check as fallback
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
            // Use miner_id as it represents the instance, wait... we need unique items!
            // The set bonus says "unique miners" meaning different items. 
            // In API `filename` or `name` represents the unique item type, 
            // but Rollercoin typically means unique *types* of miners from the set.
            // But wait, the previous code used `miner_id` which was instance ID? 
            // Wait, miner_id in API represents instance ID? Wait, no.
            // Let's check what it should be. The previous code used miner_id.
            if (!uniqueSet.has(miner.filename || miner.name)) {
                uniqueSet.add(miner.filename || miner.name);
                rackMiners.get(rackId)!.push(miner);
            }
        }
    }

    // Evaluate sets for each rack
    for (const [rackId, miners] of rackMiners.entries()) {
        const uniqueCount = miners.length;
        if (uniqueCount === 0) continue;

        // Try to guess the set using the first miner on the rack
        const guessedSet = guessSetByMiner(miners[0]);

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
