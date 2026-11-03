import assert from 'node:assert/strict';
import { forgeBatchParts, forgePlan, forgeForward } from '../src/utils/forgeAnalysis';
const recipes = { 0: { count: 50, fee: 2000 }, 1: { count: 20, fee: 50000 }, 2: { count: 10, fee: 750000 }, 3: { count: 5, fee: 1600000 } };
// Three independent screenshots: 3 Legendary, 11 Epic and 83 Rare at Forge 5.
assert.equal(forgeBatchParts(5, 3, 5), 11);
assert.equal(forgeBatchParts(10, 11, 5), 83);
assert.equal(forgeBatchParts(20, 83, 5), 1245);
const plan = forgePlan(recipes, 1, 4, 3, 5);
assert.equal(plan.required, 1245);
assert.deepEqual(plan.steps.map(x => x.mergeCount), [83, 11, 3]);
assert.deepEqual(plan.steps.map(x => x.totalFee), [3112500, 6187500, 3600000]);
assert.equal(plan.totalFees, 12900000);
assert.equal(forgePlan(recipes, 1, 4, 1, 5).required, 450);
assert.equal(forgeForward(recipes, 1, 4, 1245, 5).producedCount, 3);
assert.equal(forgeForward(recipes, 1, 4, 1244, 5).producedCount, 2);
for (const level of [1, 2, 3, 4, 5]) {
    for (let source = 0; source < 4; source++) {
        for (let target = source + 1; target <= 4; target++) {
            for (const quantity of [1, 2, 3, 11, 83, 100]) {
                const needed = forgePlan(recipes, source, target, quantity, level).required;
                assert.equal(forgeForward(recipes, source, target, needed, level).producedCount, quantity);
                assert.equal(forgeForward(recipes, source, target, needed - 1, level).producedCount, quantity - 1);
            }
        }
    }
}
console.log('Batch rounding, screenshot fees and all Forge level boundaries passed');

// Independent expected batches for 3 Legendary, using each Forge discount.
for (const [level, uncommon, rare, epic, fee] of [
    [1, 3000, 150, 15, 23550000],
    [2, 2527, 133, 14, 20852500],
    [3, 2268, 126, 14, 19440000],
    [4, 1887, 111, 13, 17085000],
    [5, 1245, 83, 11, 12900000],
]) {
    const plan = forgePlan(recipes, 1, 4, 3, level);
    assert.equal(plan.required, uncommon, 'Uncommon level ' + level);
    assert.deepEqual(plan.steps.map(x => x.mergeCount), [rare, epic, 3], 'Batch level ' + level);
    assert.equal(plan.totalFees, fee, 'Fee level ' + level);
}
console.log('Explicit Forge 1–5 batch and fee fixtures passed');
