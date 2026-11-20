import { EarningsResult, HashPower } from '../types';
import { toBaseUnit } from './powerParser';
import { PowerAllocations } from '../hooks/usePowerAllocations';

/** Shared pool adjustment for the earnings table and withdrawal estimates. */
export function calculateAllocatedEarnings(
    base: EarningsResult,
    userPower: HashPower | null,
    source: PowerAllocations,
    target: PowerAllocations,
): EarningsResult {
    if (!userPower || (!Object.keys(source).length && !Object.keys(target).length)) return base;
    const userBase = toBaseUnit(userPower);
    const leagueBase = toBaseUnit(base.leaguePower);
    const targeted = target[base.displayName] !== undefined;
    // No "currently mining" entry: assume the user already mines the target split (matches RollerCoin's My rewards).
    const sourcePercent = (Object.keys(source).length ? source : target)[base.displayName];
    // User's power already counted in this coin's league power. Unknown + untargeted keeps the old
    // assumption that the whole user power is inside it (capped, since small leagues can be smaller than the user).
    const current = sourcePercent !== undefined
        ? userBase * (sourcePercent / 100)
        : (targeted ? 0 : Math.min(userBase, leagueBase));
    const pool = Math.max(0, leagueBase - current);
    const allocated = userBase * ((target[base.displayName] ?? 100) / 100);
    const denominator = pool + allocated;
    const share = allocated > 0 ? (denominator > 0 ? Math.min(1, allocated / denominator) : 1) : 0;
    const originalShare = base.powerShare / 100;
    const ratio = originalShare > 0 ? share / originalShare : 0;
    return {
        ...base,
        powerShare: share * 100,
        earnings: {
            perBlock: base.earnings.perBlock * ratio,
            hourly: base.earnings.hourly * ratio,
            daily: base.earnings.daily * ratio,
            weekly: base.earnings.weekly * ratio,
            monthly: base.earnings.monthly * ratio,
        },
    };
}
