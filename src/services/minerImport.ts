import { fetchUserMinersFromApi } from './userApi';
import type { ImportedMiner } from '../utils/minerImport';

export async function resolveImportedMiners(items: ImportedMiner[]): Promise<ImportedMiner[]> {
    const resolved: ImportedMiner[] = [];
    for (const item of items) {
        if (item.miner) { resolved.push(item); continue; }
        let page = 0;
        let miner;
        let hasNext: boolean;
        const tolerance = item.powerToleranceGh ?? 0;
        do {
            // Names can differ between game languages; match the stable ID.
            const result = await fetchUserMinersFromApi({ PageIndex: page, MinMinerPower: Math.max(0, item.power - tolerance),
                MaxMinerPower: item.power + tolerance, MinMinerBonus: item.percent, MaxMinerBonus: item.percent });
            miner = result.items.find(candidate => candidate.id.toLowerCase() === item.id);
            hasNext = result.hasNext;
            if (miner || !result.hasNext) break;
            page++;
        } while (hasNext);
        if (!miner || ![1, 2].includes(miner.width) || !miner.fileName) throw new Error(`Miner unavailable: ${item.name}`);
        resolved.push({ ...item, name: miner.name, power: miner.power, percent: miner.percent, miner });
    }
    return resolved;
}
