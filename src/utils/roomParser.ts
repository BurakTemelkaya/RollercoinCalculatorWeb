import { RollercoinRoomResponse, ApiRoomRack } from '../types/room';
import { calculateSetBonuses } from './setCalculator';

export interface ExactPowerStats {
    baseMinerPowerGh: number;
    collectionBonusPercent: number; // e.g., 1676.02 for 16.7602%
    rackBonusPowerGh: number;
    totalSetBonusPowerGh: number;
    totalLeaguePowerGh: number;
    placedMinersCount: number;
}

/**
 * Calculates the EXACT League Power from the user's raw room data.
 * This completely bypasses the API's aggregated max_power and bonus_percent
 * which include hidden inventory bonuses that don't count towards league power.
 * 
 * Formula: League Power = Base Miner Power + (Base Miner Power * Collection Bonus) + Rack Bonus
 */
export function calculateExactRoomPower(
    roomData: RollercoinRoomResponse,
    originalRoomData?: RollercoinRoomResponse | null,
    baselineBonusPercent?: number
): ExactPowerStats {
    if (!roomData || !roomData.miners) {
        return {
            baseMinerPowerGh: 0,
            collectionBonusPercent: 0,
            rackBonusPowerGh: 0,
            totalSetBonusPowerGh: 0,
            totalLeaguePowerGh: 0,
            placedMinersCount: 0
        };
    }

    let baseMinerPower = 0;
    let rackBonusPower = 0;
    let placedMinersCount = 0;

    // To calculate collection bonus, we only sum the bonus of UNIQUE miners placed on racks.
    // In RollerCoin, different levels of the same miner are treated as unique (different miner_id).
    const uniqueMinerIds = new Set<string>();
    let collectionBonusSum = 0; // In raw integer format, e.g., 418 = 4.18%

    // Create a map for quick rack lookup
    const rackMap = new Map<string, ApiRoomRack>();
    if (roomData.racks) {
        for (const rack of roomData.racks) {
            rackMap.set(rack._id, rack);
        }
    }

    // 3. Calculate Set Bonuses (Global)
    const simulatedSetBonuses = calculateSetBonuses(roomData);
    let totalSetBonusPercent = 0;
    let totalSetBonusPowerGh = 0;

    for (const setBonus of simulatedSetBonuses.values()) {
        totalSetBonusPercent += setBonus.percent_power;
        totalSetBonusPowerGh += setBonus.bonus_power;
    }

    for (const miner of roomData.miners) {
        // Only count miners that are actually placed on a rack in a room
        if (miner.placement && miner.placement.user_rack_id) {
            placedMinersCount++;
            baseMinerPower += miner.power;

            // 1. Collection Bonus Calculation
            if (!uniqueMinerIds.has(miner.miner_id)) {
                uniqueMinerIds.add(miner.miner_id);
                collectionBonusSum += (miner.bonus_percent || 0);
            }

            // 2. Rack Bonus Calculation
            const rackId = miner.placement.user_rack_id;
            const rack = rackMap.get(rackId);
            
            // Get standard rack bonus
            let rackBonusPercent = rack ? ((rack as any).bonus ?? rack.bonus_percent) : 0;
            if (!rackBonusPercent) rackBonusPercent = 0;

            if (rackBonusPercent > 0) {
                // e.g., 500 = 5%
                const rackBonusForThisMiner = miner.power * (rackBonusPercent / 10000);
                rackBonusPower += rackBonusForThisMiner;
            }
        }
    }

    // API values for miner power are already in Gh/s
    const baseMinerPowerGh = baseMinerPower;
    const rackBonusPowerGh = rackBonusPower;

    // Total calculation
    let finalCollectionBonusSum = collectionBonusSum;

    if (baselineBonusPercent !== undefined && originalRoomData) {
        // Calculate the base collection bonus sum for the original room
        let originalCollectionBonusSum = 0;
        const originalUniqueMinerIds = new Set<string>();
        if (originalRoomData.miners) {
            for (const m of originalRoomData.miners) {
                if (m.placement && m.placement.user_rack_id && !originalUniqueMinerIds.has(m.miner_id)) {
                    originalUniqueMinerIds.add(m.miner_id);
                    originalCollectionBonusSum += (m.bonus_percent || 0);
                }
            }
        }
        
        const originalSetBonuses = calculateSetBonuses(originalRoomData);
        let originalSetBonusPercent = 0;
        for (const setBonus of originalSetBonuses.values()) {
            originalSetBonusPercent += setBonus.percent_power;
        }

        // The unexplained hidden bonus is the difference between the baseline bonus and the original room's base sum AND original set bonuses
        const unexplainedHiddenBonusSum = Math.max(0, baselineBonusPercent - originalCollectionBonusSum - originalSetBonusPercent);
        
        // The final bonus is the simulated room's base sum + simulated set bonus + unexplained hidden bonus
        finalCollectionBonusSum = collectionBonusSum + totalSetBonusPercent + unexplainedHiddenBonusSum;
    } else {
        finalCollectionBonusSum = collectionBonusSum + totalSetBonusPercent;
    }

    const collectionBonusMultiplier = finalCollectionBonusSum / 10000;

    // Set Bonus Power is a FLAT addition, it does NOT get multiplied by Collection Bonus!
    const totalLeaguePowerGh = baseMinerPowerGh + (baseMinerPowerGh * collectionBonusMultiplier) + rackBonusPowerGh + totalSetBonusPowerGh;

    return {
        baseMinerPowerGh: baseMinerPowerGh,
        collectionBonusPercent: finalCollectionBonusSum,
        rackBonusPowerGh,
        totalSetBonusPowerGh,
        totalLeaguePowerGh,
        placedMinersCount
    };
}
