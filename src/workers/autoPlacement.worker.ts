import { optimizeRoomPlacement, type AutoPlacementOptions } from '../utils/autoPlacement';
import type { RollercoinRoomResponse } from '../types/room';
import type { ImportedMiner } from '../utils/minerImport';
import type { GetRackSetListDto } from '../services/rackApi';

self.onmessage = (event: MessageEvent<{ room: RollercoinRoomResponse; inventory: ImportedMiner[]; sets?: GetRackSetListDto[]; maxPowerGh?: number; options?: AutoPlacementOptions }>) => {
    try {
        const { room, inventory, sets, maxPowerGh, options } = event.data;
        self.postMessage({ result: optimizeRoomPlacement(room, inventory, sets, maxPowerGh, options) });
    } catch {
        self.postMessage({ error: true });
    }
};
