import { RollercoinRoomResponse, ApiRoomRack } from '../types/room';
import { calculateSetBonuses } from './setCalculator';

export interface ExactPowerStats {
    baseMinerPowerGh: number;
    collectionBonusPercent: number;     // ham integer (418 = 4.18%)
    collectionBonusPowerGh: number;     // baseMiner × (collectionBonus / 10000)
    rackBonusPowerGh: number;
    setPercentBonusPowerGh: number;     // baseMiner × (Σ set.percent_power / 10000)
    setBonusPowerGh: number;            // Σ set.bonus_power (düz Gh/s)
    totalLeaguePowerGh: number;         // Lig gücü (hamster+freon+games+temp hariç)
    placedMinersCount: number;
}

/**
 * Calculates the EXACT League Power from the user's raw room data.
 * 
 * League Power = baseMinerPower + collectionBonus + rackBonus + setPercentBonus + setBonusPower
 * 
 * Everything else (freon, hamster, games, temp) is temporary power and NOT included.
 */
export function calculateExactRoomPower(roomData: RollercoinRoomResponse): ExactPowerStats {
    if (!roomData || !roomData.miners) {
        return {
            baseMinerPowerGh: 0,
            collectionBonusPercent: 0,
            collectionBonusPowerGh: 0,
            rackBonusPowerGh: 0,
            setPercentBonusPowerGh: 0,
            setBonusPowerGh: 0,
            totalLeaguePowerGh: 0,
            placedMinersCount: 0
        };
    }

    let baseMinerPower = 0;
    let rackBonusPower = 0;
    let placedMinersCount = 0;

    // Collection bonus: only UNIQUE miner_ids contribute their bonus_percent
    const uniqueMinerIds = new Set<string>();
    let collectionBonusSum = 0; // Raw integer format, e.g., 418 = 4.18%

    // Quick rack lookup map
    const rackMap = new Map<string, ApiRoomRack>();
    if (roomData.racks) {
        for (const rack of roomData.racks) {
            rackMap.set(rack._id, rack);
        }
    }

    // 1. Iterate placed miners: accumulate base power, collection bonus, rack bonus
    for (const miner of roomData.miners) {
        if (miner.placement && miner.placement.user_rack_id) {
            placedMinersCount++;
            baseMinerPower += miner.power;

            // Collection Bonus: unique miner_id only
            if (!uniqueMinerIds.has(miner.miner_id)) {
                uniqueMinerIds.add(miner.miner_id);
                collectionBonusSum += (miner.bonus_percent || 0);
            }

            // Rack Bonus: each miner gets its rack's bonus % applied to its own power
            const rackId = miner.placement.user_rack_id;
            const rack = rackMap.get(rackId);
            let rackBonusPercent = rack ? ((rack as any).bonus ?? rack.bonus_percent) : 0;
            if (!rackBonusPercent) rackBonusPercent = 0;

            if (rackBonusPercent > 0) {
                rackBonusPower += miner.power * (rackBonusPercent / 10000);
            }
        }
    }

    // 2. Set Bonuses (calculated globally across all racks)
    const setBonuses = calculateSetBonuses(roomData);
    let totalSetPercentPower = 0; // Sum of percent_power from all achieved set levels
    let totalSetBonusPowerGh = 0; // Sum of bonus_power (flat Gh/s) from all achieved set levels

    for (const setBonus of setBonuses.values()) {
        totalSetPercentPower += setBonus.percent_power;
        totalSetBonusPowerGh += setBonus.bonus_power;
    }

    // 3. Calculate derived values
    const baseMinerPowerGh = baseMinerPower;
    const rackBonusPowerGh = rackBonusPower;

    // Collection bonus power: baseMinerPower × (collectionBonusSum / 10000)
    const collectionBonusPowerGh = baseMinerPowerGh * (collectionBonusSum / 10000);

    // Set percent bonus power: baseMinerPower × (totalSetPercentPower / 10000)
    // Applied to ALL miner power, not per-rack
    const setPercentBonusPowerGh = baseMinerPowerGh * (totalSetPercentPower / 10000);

    // 4. Total League Power = base + collection + rack + setPercent + setBonusPower
    const totalLeaguePowerGh = baseMinerPowerGh
        + collectionBonusPowerGh
        + rackBonusPowerGh
        + setPercentBonusPowerGh
        + totalSetBonusPowerGh;

    return {
        baseMinerPowerGh,
        collectionBonusPercent: collectionBonusSum,
        collectionBonusPowerGh,
        rackBonusPowerGh,
        setPercentBonusPowerGh,
        setBonusPowerGh: totalSetBonusPowerGh,
        totalLeaguePowerGh,
        placedMinersCount
    };
}
