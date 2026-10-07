import { SETS_DATA } from '../data/sets';
import type { GetRackSetListDto } from '../services/rackApi';
import type { MinerDto } from '../services/userApi';
import type { ApiRoomRack } from '../types/room';
import { guessSetByRackName } from './setCalculator';

export interface RackSetCatalogItem {
    id: string;
    filename: string;
    name: string;
    miner?: MinerDto;
}

export function getRackSetName(rackId: string, rackName: string, dynamicSets?: GetRackSetListDto[]): string | null {
    return dynamicSets?.find(set => set.requiredRackId === rackId)?.name
        || SETS_DATA.find(set => set.rack?.id === rackId)?.title.en
        || guessSetByRackName(rackName)?.title.en
        || null;
}

export function getRackSetCatalog(rack: ApiRoomRack, dynamicSets?: GetRackSetListDto[]) {
    const local = SETS_DATA.find(set => set.rack?.id === rack.rack_id) || guessSetByRackName(rack.name);
    const dynamic = dynamicSets?.find(set => set.requiredRackId === rack.rack_id);
    if (dynamic) {
        return {
            name: dynamic.name,
            items: dynamic.rackSetItems.map(item => {
                const fallback = local?.miners?.find(miner => miner.item_id === item.minerId || miner.filename === item.minerFilename);
                return {
                    id: item.minerId,
                    filename: item.minerFilename,
                    name: item.miner?.name || fallback?.title.en || item.minerFilename,
                    miner: item.miner ?? undefined,
                };
            }),
        };
    }
    if (!local) return null;
    return {
        name: local.title.en,
        items: (local.miners || []).map(miner => ({ id: miner.item_id, filename: miner.filename, name: miner.title.en })),
    };
}

export function isMinerInRackSet(rack: ApiRoomRack, minerId: string, filename: string, dynamicSets?: GetRackSetListDto[]) {
    return getRackSetCatalog(rack, dynamicSets)?.items.some(item =>
        item.id === minerId || item.filename === filename
    ) ?? false;
}
