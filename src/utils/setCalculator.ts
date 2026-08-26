import { SETS_DATA, RollercoinSet } from '../data/sets';
import { ApiRoomMiner, RollercoinRoomResponse } from '../types/room';
import type { GetRackSetListDto } from '../services/rackApi';

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

/**
 * Calculates set bonuses using DYNAMIC data from the backend API.
 * This is the preferred path when API data is available.
 */
function calculateSetBonusesDynamic(
    roomData: RollercoinRoomResponse,
    dynamicSets: GetRackSetListDto[]
): Map<string, SetBonusResult> {
    const rackBonuses = new Map<string, SetBonusResult>();

    if (!roomData || !roomData.miners) {
        return rackBonuses;
    }

    // Build a lookup: rack definition ID → dynamic set data
    const rackIdToSet = new Map<string, GetRackSetListDto>();
    for (const setData of dynamicSets) {
        if (setData.requiredRackId) {
            rackIdToSet.set(setData.requiredRackId, setData);
        }
    }

    // Build a lookup: user_rack_id → rack definition rack_id
    const userRackToDefRack = new Map<string, string>();
    if (roomData.racks) {
        for (const r of roomData.racks) {
            userRackToDefRack.set(r._id, r.rack_id);
        }
    }

    // Build a lookup: set ID → Set of miner filenames belonging to that set
    const setMinerFilenames = new Map<string, Set<string>>();
    for (const setData of dynamicSets) {
        const filenames = new Set<string>();
        for (const item of (setData.rackSetItems || [])) {
            if (item.minerFilename) {
                filenames.add(item.minerFilename);
            }
        }
        setMinerFilenames.set(setData.id, filenames);
    }

    // Group is_in_set miners by their user_rack_id, tracking unique filenames
    const rackUniqueMiners = new Map<string, Set<string>>();

    for (const miner of roomData.miners) {
        if (miner.is_in_set && miner.placement && miner.placement.user_rack_id) {
            const userRackId = miner.placement.user_rack_id;
            const defRackId = userRackToDefRack.get(userRackId);
            if (!defRackId) continue;

            // Check if this rack is a required set rack
            const setData = rackIdToSet.get(defRackId);
            if (!setData) continue;

            // Check if this miner actually belongs to this set
            const validFilenames = setMinerFilenames.get(setData.id);
            if (!validFilenames || !validFilenames.has(miner.filename)) continue;

            if (!rackUniqueMiners.has(userRackId)) {
                rackUniqueMiners.set(userRackId, new Set<string>());
            }
            rackUniqueMiners.get(userRackId)!.add(miner.filename);
        }
    }

    // Evaluate set levels for each qualifying rack
    for (const [userRackId, uniqueFilenames] of rackUniqueMiners.entries()) {
        const defRackId = userRackToDefRack.get(userRackId);
        if (!defRackId) continue;

        const setData = rackIdToSet.get(defRackId);
        if (!setData || !setData.rackSetLevels) continue;

        const uniqueCount = uniqueFilenames.size;
        if (uniqueCount === 0) continue;

        // Find ALL levels achieved (summative bonuses)
        const achievedLevels = setData.rackSetLevels.filter(
            l => uniqueCount >= l.conditionAmount
        );

        if (achievedLevels.length > 0) {
            let totalPercentPower = 0;
            let totalBonusPower = 0;

            for (const level of achievedLevels) {
                totalPercentPower += level.bonusPercent || 0;
                // Dynamic sets use bonusPercent; flat bonus_power is not in the DTO currently
            }

            rackBonuses.set(userRackId, {
                percent_power: totalPercentPower,
                bonus_power: totalBonusPower
            });
        }
    }

    return rackBonuses;
}

/**
 * Calculates set bonuses using HARDCODED local data (fallback).
 * Used when the API is unavailable or returns empty data.
 */
function calculateSetBonusesFallback(
    roomData: RollercoinRoomResponse
): Map<string, SetBonusResult> {
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
        const guessedSet = guessSetByMiner(miners[0]);

        if (guessedSet && guessedSet.levels && guessedSet.rack) {
            // Verify that this rack is actually the required Set Rack!
            const definitionRackId = userRackToDefRack.get(rackId);
            if (definitionRackId !== guessedSet.rack.id) {
                continue; // Miners are not on the correct Set Rack!
            }
            
            // Re-count unique miners that ACTUALLY belong to this specific set
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

/**
 * Main entry point for set bonus calculation.
 * Uses dynamic API data when available, falls back to hardcoded data otherwise.
 * 
 * @param roomData - The user's room data from Rollercoin API
 * @param dynamicSets - Optional set rack data from our backend API
 */
export function calculateSetBonuses(
    roomData: RollercoinRoomResponse,
    dynamicSets?: GetRackSetListDto[]
): Map<string, SetBonusResult> {
    if (dynamicSets && dynamicSets.length > 0) {
        return calculateSetBonusesDynamic(roomData, dynamicSets);
    }
    return calculateSetBonusesFallback(roomData);
}
