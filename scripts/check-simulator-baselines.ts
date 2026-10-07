import assert from 'node:assert/strict';
import { createEmptyRoom, createManualPowerBaseline, calculateManualPower } from '../src/utils/simulatorBaseline';
import { calculateExactRoomPower } from '../src/utils/roomParser';

const empty = createEmptyRoom();
assert.equal(empty.rooms?.length, 1);
assert.equal(empty.rooms?.[0].room_info.level, 0);
assert.equal(empty.racks?.length, 0);
assert.equal(calculateExactRoomPower(empty).totalLeaguePowerGh, 0);
assert.notEqual(createEmptyRoom().miners, empty.miners, 'Restarted rooms must not share mutable inventories');

const added = [{ power: 100, bonus: 5, rackBonus: 10 }];
const zero = calculateManualPower(createManualPowerBaseline(0), added);
assert.equal(zero.newTotalPowerGh, 115);
assert.equal(zero.newLeaguePowerGh, 115);

const custom = createManualPowerBaseline(1000, 10);
assert.equal(custom.currentTotalPowerGh, 1100);
const fromCustom = calculateManualPower(custom, added);
assert.equal(fromCustom.newTotalPowerGh, 1275);
assert.equal(fromCustom.newLeaguePowerGh, 1275);
assert.equal(fromCustom.powerIncreaseGh, 175);
assert.equal(calculateManualPower(custom, []).powerIncreaseGh, 0);

const account = {
    ...createManualPowerBaseline(1000, 50),
    baseMinerPowerGh: 800, collectionBonusPercent: 2000,
    currentTotalPowerGh: 1800, currentLeaguePowerGh: 1000,
    flatBonusGh: 100, tempPowerGh: 20, gamesPowerGh: 30, unlistedPowerGh: 150
};
const fromAccount = calculateManualPower(account, added);
assert.equal(fromAccount.newTotalPowerGh, 2015);
assert.equal(fromAccount.newLeaguePowerGh, 1175);
assert.equal(calculateManualPower(account, []).newTotalPowerGh, account.currentTotalPowerGh);
assert.equal(createManualPowerBaseline(Number.NaN, -10).currentTotalPowerGh, 0);
console.log('Simulator baseline checks passed');
