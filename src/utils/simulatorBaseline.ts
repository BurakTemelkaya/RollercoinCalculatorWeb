import type { RollercoinRoomResponse } from '../types/room';

export function createEmptyRoom(): RollercoinRoomResponse {
    return {
        is_user_from_session: false,
        miners: [],
        racks: [],
        rooms: [{
            _id: 'sandbox_room_0',
            room_info: { room_id: 'sandbox_room_type', level: 0, cols: 8, rows: 3 }
        }]
    };
}

export interface ManualPowerBaseline {
    baseMinerPowerGh: number;
    collectionBonusPercent: number;
    rackBonusPowerGh: number;
    currentTotalPowerGh: number;
    currentLeaguePowerGh: number;
    placedMinersCount: number;
    globalBaseMinerPowerGh: number;
    globalBonusPercent: number;
    tempPowerGh: number;
    gamesPowerGh: number;
    flatBonusGh: number;
    unlistedPowerGh: number;
}

export function createManualPowerBaseline(powerGh: number, minerBonusPercent = 0): ManualPowerBaseline {
    const power = Number.isFinite(powerGh) ? Math.max(0, powerGh) : 0;
    const bonus = Number.isFinite(minerBonusPercent) ? Math.max(0, minerBonusPercent) : 0;
    const total = power * (1 + bonus / 100);
    return {
        baseMinerPowerGh: power,
        collectionBonusPercent: bonus * 100,
        rackBonusPowerGh: 0,
        currentTotalPowerGh: total,
        currentLeaguePowerGh: total,
        placedMinersCount: 0,
        globalBaseMinerPowerGh: power,
        globalBonusPercent: bonus * 100,
        tempPowerGh: 0,
        gamesPowerGh: 0,
        flatBonusGh: 0,
        unlistedPowerGh: 0
    };
}

export function calculateManualPower(baseline: ManualPowerBaseline, miners: readonly {
    power: number; bonus: number; rackBonus: number;
}[]) {
    let totalAddedPower = 0;
    let totalAddedBonusPercent = 0;
    let totalAddedRackPower = 0;
    for (const miner of miners) {
        totalAddedPower += miner.power;
        totalAddedBonusPercent += miner.bonus;
        totalAddedRackPower += miner.power * miner.rackBonus / 100;
    }
    const newBase = baseline.globalBaseMinerPowerGh + totalAddedPower;
    const newBonus = baseline.globalBonusPercent / 10000 + totalAddedBonusPercent / 100;
    const newTotalPowerGh = newBase * (1 + newBonus) + baseline.flatBonusGh
        + baseline.tempPowerGh + baseline.gamesPowerGh + baseline.unlistedPowerGh + totalAddedRackPower;
    const leaguePowerDeltaGh = totalAddedPower * (1 + baseline.collectionBonusPercent / 10000)
        + (baseline.baseMinerPowerGh + totalAddedPower) * totalAddedBonusPercent / 100 + totalAddedRackPower;
    return {
        newTotalPowerGh,
        newLeaguePowerGh: baseline.currentLeaguePowerGh + leaguePowerDeltaGh,
        powerIncreaseGh: newTotalPowerGh - baseline.currentTotalPowerGh,
        leaguePowerDeltaGh,
        totalAddedPower,
        totalAddedBonusPercent,
        totalAddedRackPower
    };
}
