import assert from 'node:assert/strict';
import { calculateCoinEarnings } from '../src/utils/calculator';
import { calculateAllocatedEarnings } from '../src/utils/powerAllocation';
import { HashPower } from '../src/types';

const power: HashPower = { value: 100, unit: 'Gh' };
const base = calculateCoinEarnings({ code: 'doge', displayName: 'DOGE', leaguePower: { value: 1000, unit: 'Gh' }, leaguePowerFormatted: '1 Th/s', isGameToken: false }, power, { DOGE: 1 }, 600);
const near = (actual: number, expected: number) => assert(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

assert.equal(calculateAllocatedEarnings(base, power, {}, {}), base);
near(base.earnings.daily, 14.4);
const target = calculateAllocatedEarnings(base, power, {}, { DOGE: 30 });
// With nothing under "currently mining", the target split is assumed to be mined already.
near(target.earnings.daily, 144 * 30 / 1000);
near(50 / target.earnings.daily, 50 / 4.32);
// Removing the previous 100% allocation before adding 30% uses a 930 Gh pool.
near(calculateAllocatedEarnings(base, power, { DOGE: 100 }, { DOGE: 30 }).earnings.daily, 144 * 30 / 930);
near(calculateAllocatedEarnings(base, power, { DOGE: 100 }, { DOGE: 100 }).earnings.daily, base.earnings.daily);
near(calculateAllocatedEarnings(base, power, { BTC: 100 }, { DOGE: 30 }).earnings.daily, 144 * 30 / 1030);
near(calculateAllocatedEarnings(base, power, {}, { DOGE: 0 }).earnings.daily, 0);
near(calculateAllocatedEarnings(base, { value: 0, unit: 'Gh' }, {}, { DOGE: 30 }).earnings.daily, 0);
const entirePool = { ...base, leaguePower: power };
near(calculateAllocatedEarnings(entirePool, power, { DOGE: 100 }, {}).powerShare, 100);
// Small league: user power (1168.6 Zh) exceeds the coin pool (463.52 Zh) that already holds the user's 8%.
const smallUser: HashPower = { value: 1168.6, unit: 'Zh' };
const trx = calculateCoinEarnings({ code: 'trx', displayName: 'TRX', leaguePower: { value: 463.52, unit: 'Zh' }, leaguePowerFormatted: '', isGameToken: false }, smallUser, { TRX: 0.21 }, 600);
near(calculateAllocatedEarnings(trx, smallUser, { TRX: 8 }, { TRX: 8 }).powerShare, 1168.6 * 0.08 / 463.52 * 100);
near(calculateAllocatedEarnings(trx, smallUser, { TRX: 8 }, {}).powerShare, 1168.6 / (463.52 - 1168.6 * 0.08 + 1168.6) * 100);
near(calculateAllocatedEarnings(trx, smallUser, {}, { TRX: 8 }).powerShare, 1168.6 * 0.08 / 463.52 * 100);
for (const period of ['perBlock', 'hourly', 'daily', 'weekly', 'monthly'] as const) {
    near(target.earnings[period] / base.earnings[period], (30 / 1000) / 0.1);
}
console.log('Passed: shared pool allocation, source removal, same-coin reallocation, 0% power and consistent earnings periods.');
