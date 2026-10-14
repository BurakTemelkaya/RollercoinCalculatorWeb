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
near(target.earnings.daily, 144 * 30 / 1030);
near(50 / target.earnings.daily, 11.921296296296296);
// Removing the previous 100% allocation before adding 30% uses a 930 Gh pool.
near(calculateAllocatedEarnings(base, power, { DOGE: 100 }, { DOGE: 30 }).earnings.daily, 144 * 30 / 930);
near(calculateAllocatedEarnings(base, power, { DOGE: 100 }, { DOGE: 100 }).earnings.daily, base.earnings.daily);
near(calculateAllocatedEarnings(base, power, { BTC: 100 }, { DOGE: 30 }).earnings.daily, target.earnings.daily);
near(calculateAllocatedEarnings(base, power, {}, { DOGE: 0 }).earnings.daily, 0);
near(calculateAllocatedEarnings(base, { value: 0, unit: 'Gh' }, {}, { DOGE: 30 }).earnings.daily, 0);
const entirePool = { ...base, leaguePower: power };
near(calculateAllocatedEarnings(entirePool, power, { DOGE: 100 }, {}).powerShare, 100);
for (const period of ['perBlock', 'hourly', 'daily', 'weekly', 'monthly'] as const) {
    near(target.earnings[period] / base.earnings[period], (30 / 1030) / 0.1);
}
console.log('Passed: shared pool allocation, source removal, same-coin reallocation, 0% power and consistent earnings periods.');
