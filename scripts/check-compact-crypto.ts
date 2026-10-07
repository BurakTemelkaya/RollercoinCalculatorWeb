import assert from 'node:assert/strict';
import { getCompactCryptoAmount } from '../src/utils/calculator';

for (const currency of ['ETH', 'BNB', 'SOL']) {
    for (const [amount, zeros, digits] of [
        [0.000078, 4, '78'],
        [0.00000123, 5, '123'],
        [0.000328, 3, '328'],
        [1.23e-12, 11, '123'],
        [0.0000999999, 3, '1'], // Rounding carries into the preceding zero.
        [-0.000078, 4, '78'],
    ] as const) {
        const compact = getCompactCryptoAmount(amount, currency);
        assert.ok(compact);
        assert.equal(compact.zeroCount, zeros);
        assert.equal(compact.digits, digits);
        assert.equal(compact.prefix, amount < 0 ? '-0.0' : '0.0');
        assert.equal(Number(`${amount < 0 ? '-' : ''}0.${'0'.repeat(zeros)}${digits}`), Number(compact.fullValue));
    }
    for (const amount of [0, NaN, Infinity, -Infinity, 0.00123, 1, 1200]) {
        assert.equal(getCompactCryptoAmount(amount, currency), null);
    }
}
for (const currency of ['BTC', 'RLT', 'DOGE']) {
    assert.equal(getCompactCryptoAmount(0.000078, currency), null);
}
assert.equal(getCompactCryptoAmount(0.000078, 'eth')?.zeroCount, 4);
console.log('Compact crypto formatting: zero counts, tiny values, rounding, signs and fallbacks passed.');
