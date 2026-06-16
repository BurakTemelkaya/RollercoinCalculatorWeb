import { RollercoinRoomResponse, ApiRoomRack } from '../types/room';

export interface ExactPowerStats {
    baseMinerPowerGh: number;
    collectionBonusPercent: number; // e.g., 1676.02 for 16.7602%
    rackBonusPowerGh: number;
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
export function calculateExactRoomPower(roomData: RollercoinRoomResponse): ExactPowerStats {
    if (!roomData || !roomData.miners) {
        return {
            baseMinerPowerGh: 0,
            collectionBonusPercent: 0,
            rackBonusPowerGh: 0,
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

    for (const miner of roomData.miners) {
        // Only count miners that are actually placed on a rack in a room
        if (miner.placement && miner.placement.user_rack_id) {
            placedMinersCount++;
            baseMinerPower += miner.power;

            // 1. Collection Bonus Calculation
            // Add bonus if this is the first time we see this miner model/level on a rack
            if (!uniqueMinerIds.has(miner.miner_id)) {
                uniqueMinerIds.add(miner.miner_id);
                collectionBonusSum += (miner.bonus_percent || 0);
            }

            // 2. Rack Bonus Calculation
            // Rack bonus only applies to the miners physically placed on that specific rack
            const rack = rackMap.get(miner.placement.user_rack_id);
            const rackBonusPercent = rack ? ((rack as any).bonus ?? rack.bonus_percent) : undefined;
            if (rackBonusPercent) {
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
    // collectionBonusSum is something like 167602 which means 16.7602% (or 1676.02 in UI units)
    // Actually the UI uses `uiBaseBonusVal` where 1676.02 is displayed.
    // Mathematically: power * (1 + bonus / 10000)
    const collectionBonusMultiplier = collectionBonusSum / 10000;
    
    const totalLeaguePowerGh = baseMinerPowerGh + (baseMinerPowerGh * collectionBonusMultiplier) + rackBonusPowerGh;

    return {
        baseMinerPowerGh,
        collectionBonusPercent: collectionBonusSum,
        rackBonusPowerGh,
        totalLeaguePowerGh,
        placedMinersCount
    };
}
