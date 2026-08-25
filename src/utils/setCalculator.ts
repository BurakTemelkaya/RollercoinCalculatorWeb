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

    // Map user_rack_id to its definition rack_id
    const userRackToDefRack = new Map<string, string>();
    if (roomData.racks) {
        for (const r of roomData.racks) {
            userRackToDefRack.set(r._id, r.rack_id);
        }
    }

    // Evaluate sets for each rack
    for (const [rackId, miners] of rackMiners.entries()) {
        if (miners.length === 0) continue;

        // Try to guess the set using the first miner on the rack
        // Note: A more robust way is to find the set based on the rack definition itself,
        // but guessing by miner works as long as we verify the rack matches.
        const guessedSet = guessSetByMiner(miners[0]);

        if (guessedSet && guessedSet.levels && guessedSet.rack) {
            // Verify that this rack is actually the required Set Rack!
            const definitionRackId = userRackToDefRack.get(rackId);
            if (definitionRackId !== guessedSet.rack.id) {
                continue; // Miners are not on the correct Set Rack!
            }
            
            // Re-count unique miners that ACTUALLY belong to this specific set
            // (in case a user mixed miners from different sets on the same set rack)
            const validSetMiners = new Set<string>();
            for (const miner of miners) {
                const minerBelongsToSet = guessedSet.miners?.some(sm => 
                    (miner.filename && sm.filename === miner.filename) || 
                    (miner.name && sm.title.en === miner.name)
                );
                
                if (minerBelongsToSet) {
                    validSetMiners.add(miner.filename || miner.name);
                }
            }
            
            const uniqueCount = validSetMiners.size;
            if (uniqueCount === 0) continue;

            // Find ALL levels achieved based on unique count
            const achievedLevels = guessedSet.levels.filter(l => uniqueCount >= l.condition_amount);
            
            if (achievedLevels.length > 0) {
                let totalPercentPower = 0;
                let totalBonusPower = 0;

                for (const level of achievedLevels) {
                    totalPercentPower += level.percent_power || 0;
                    totalBonusPower += level.bonus_power || 0;
                }

                rackBonuses.set(rackId, {
                    percent_power: totalPercentPower,
                    bonus_power: totalBonusPower
                });
            }
        }
    }

    return rackBonuses;
}
