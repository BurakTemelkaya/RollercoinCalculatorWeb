const fs = require('fs');

const dataStr = fs.readFileSync('roomData.json', 'utf8');
const roomData = JSON.parse(dataStr);

function calculateExactRoomPower(roomData) {
    if (!roomData || !roomData.miners) {
        return null;
    }

    let baseMinerPower = 0;
    let rackBonusPower = 0;
    let placedMinersCount = 0;
    
    const uniqueMinerIds = new Set();
    let collectionBonusSum = 0; 

    const rackMap = new Map();
    if (roomData.racks) {
        for (const rack of roomData.racks) {
            rackMap.set(rack._id, rack);
        }
    }

    for (const miner of roomData.miners) {
        if (true) {
            placedMinersCount++;
            baseMinerPower += miner.power;

            if (!uniqueMinerIds.has(miner.miner_id)) {
                uniqueMinerIds.add(miner.miner_id);
                collectionBonusSum += (miner.bonus_percent || 0);
            }

            const rack = rackMap.get(miner.placement.user_rack_id);
            const rackBonusPercent = rack ? (rack.bonus ?? rack.bonus_percent) : undefined;
            if (rackBonusPercent) {
                const rackBonusForThisMiner = miner.power * (rackBonusPercent / 10000);
                rackBonusPower += rackBonusForThisMiner;
            }
        }
    }

    const baseMinerPowerGh = baseMinerPower;
    const rackBonusPowerGh = rackBonusPower;
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

const stats = calculateExactRoomPower(roomData);
console.log(JSON.stringify(stats, null, 2));
