import { buildApiUrl } from '../config/api';
import { apiFetch, ApiError } from './apiClient';
import { fetchUserMinersFromApi, type MinerDto } from './userApi';
import type { ImportedMiner } from '../utils/minerImport';

/** Looks up every RollerCoin miner ID in one request. */
async function fetchMinersByIds(ids: string[]): Promise<MinerDto[]> {
    const response = await apiFetch(buildApiUrl('/api/Miner/get-by-ids'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ids),
    });
    return await response.json() as MinerDto[];
}

// Fallback for an API without the batch endpoint: one filtered search per miner.
async function searchMiner(item: ImportedMiner): Promise<MinerDto | undefined> {
    const tolerance = item.powerToleranceGh ?? 0;
    for (let page = 0; ; page++) {
        // The API binds power bounds as whole Gh/s; float noise like 1099500000.0000002 returns 400.
        const result = await fetchUserMinersFromApi({ PageIndex: page, MinMinerPower: Math.max(0, Math.floor(item.power - tolerance)),
            MaxMinerPower: Math.ceil(item.power + tolerance), MinMinerBonus: item.percent, MaxMinerBonus: item.percent });
        const miner = result.items.find(candidate => candidate.id.toLowerCase() === item.id);
        if (miner || !result.hasNext) return miner;
    }
}

/** Miners missing from the catalog keep the copied stats; width 2 never overfills a rack. */
function uncatalogued(item: ImportedMiner): MinerDto {
    const fileName = item.name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '') || item.id;
    return { id: item.id, name: item.name, power: item.power, percent: item.percent, width: 2, level: 0,
        fileName, type: 'miner', imageVersion: 1, createdDate: '' };
}

/** Resolves copied miners by their stable ID (names change with the game language). `missing` lists names added from copied stats. */
export async function resolveImportedMiners(items: ImportedMiner[]): Promise<{ items: ImportedMiner[]; missing: string[] }> {
    const pending = items.filter(item => !item.miner);
    let catalog: Map<string, MinerDto> | null = null;
    if (pending.length) {
        try {
            const miners = await fetchMinersByIds([...new Set(pending.map(item => item.id))]);
            catalog = new Map(miners.map(miner => [miner.id.toLowerCase(), miner]));
        } catch (error) {
            // An API deployed before get-by-ids answers 404/405; other errors (network, 429) still fail the import.
            if (!(error instanceof ApiError && (error.status === 404 || error.status === 405))) throw error;
        }
    }
    const missing: string[] = [];
    const resolved: ImportedMiner[] = [];
    for (const item of items) {
        if (item.miner) { resolved.push(item); continue; }
        let miner = catalog ? catalog.get(item.id) : await searchMiner(item);
        if (!miner || ![1, 2].includes(miner.width) || !miner.fileName) { miner = uncatalogued(item); missing.push(item.name); }
        resolved.push({ ...item, name: miner.name, power: miner.power, percent: miner.percent, miner });
    }
    return { items: resolved, missing };
}
