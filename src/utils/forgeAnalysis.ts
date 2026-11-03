export const FORGE_DISCOUNTS: Record<number, number> = { 1: 0, 2: .05, 3: .10, 4: .15, 5: .25 };
export type ForgeRecipes = Record<number, { count: number; fee: number }>;
export interface ForgeStep {
    fromLevel: number; toLevel: number; partsNeeded: number; mergeCount: number;
    feePerMerge: number; totalFee: number;
}
/** Apply the discount once to the whole batch, rounding parts to nearest integer. */
export function forgeBatchParts(baseCount: number, quantity: number, forgeLevel: number): number {
    return Math.round(baseCount * quantity * (1 - (FORGE_DISCOUNTS[forgeLevel] || 0)));
}
export function forgePlan(recipes: ForgeRecipes, start: number, target: number, quantity: number, forgeLevel: number) {
    let required = quantity;
    let totalFees = 0;
    const steps: ForgeStep[] = [];
    const factor = 1 - (FORGE_DISCOUNTS[forgeLevel] || 0);
    for (let level = target - 1; level >= start; level--) {
        const recipe = recipes[level];
        const count = forgeBatchParts(recipe.count, required, forgeLevel);
        const fee = Math.round(recipe.fee * required * factor);
        steps.unshift({ fromLevel: level, toLevel: level + 1, partsNeeded: count,
            mergeCount: required, feePerMerge: recipe.fee * factor, totalFee: fee });
        totalFees += fee;
        required = count;
    }
    return { required, totalFees, steps };
}
/** Find the largest complete target batch that fits the available source parts. */
export function forgeForward(recipes: ForgeRecipes, start: number, target: number, available: number, forgeLevel: number) {
    if (!Number.isSafeInteger(available) || available < 0) return { producedCount: 0, totalFees: 0, steps: [] as ForgeStep[] };
    let low = 0;
    let high = available;
    while (low < high) {
        const middle = low + Math.ceil((high - low) / 2);
        if (forgePlan(recipes, start, target, middle, forgeLevel).required <= available) low = middle;
        else high = middle - 1;
    }
    const plan = forgePlan(recipes, start, target, low, forgeLevel);
    return { producedCount: low, totalFees: plan.totalFees, steps: plan.steps };
}
