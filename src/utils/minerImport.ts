import type { MinerDto } from '../services/userApi';
import type { ApiRoomMiner, RollercoinRoomResponse } from '../types/room';
import { parseHashPower, toBaseUnit } from './powerParser';

export interface ImportedMiner {
    id: string;
    name: string;
    power: number;
    percent: number;
    quantity: number;
    powerToleranceGh?: number;
    miner?: MinerDto;
}

export const MAX_IMPORTED_MINERS = 10000;
export const MINER_IMPORT_STORAGE_KEY = 'rollercoin_web_imported_miners';
export const MINER_IMPORT_CHANGE_EVENT = 'miner-import-changed';
export type ImportedMinerQuantity = Pick<ImportedMiner, 'id' | 'quantity'>;

export function isValidMinerFilename(value: unknown): value is string {
    return typeof value === 'string' && /^[\p{L}\p{M}\p{N}_.&()'’ -]+$/u.test(value);
}

function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid miner data');
    return value as Record<string, unknown>;
}

export function validateImportedQuantities(items: ImportedMiner[]) {
    if (!items.length || items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 0)
        || items.reduce((sum, item) => sum + item.quantity, 0) > MAX_IMPORTED_MINERS) {
        throw new Error('Invalid miner quantities');
    }
}

export function adjustImportedQuantities(items: ImportedMiner[], changes: readonly ImportedMinerQuantity[], direction: 1 | -1): ImportedMiner[] {
    const amounts = new Map<string, number>();
    const ids = new Set(items.map(item => item.id));
    for (const change of changes) {
        // Negative deltas represent miners returned by automatic placement.
        if (!Number.isSafeInteger(change.quantity)) throw new Error('Invalid quantity change');
        if (direction === -1 && !ids.has(change.id)) throw new Error('Missing inventory miner');
        amounts.set(change.id, (amounts.get(change.id) ?? 0) + change.quantity);
    }
    const next = items.map(item => ({ ...item, quantity: item.quantity + direction * (amounts.get(item.id) ?? 0) }));
    if (next.length) validateImportedQuantities(next);
    return next;
}

export function readSavedImportedMiners(): ImportedMiner[] {
    try { return parseMinerImport(localStorage.getItem(MINER_IMPORT_STORAGE_KEY) ?? ''); }
    catch { return []; }
}

export function saveImportedMiners(items: ImportedMiner[]) {
    if (items.length) {
        validateImportedQuantities(items);
        localStorage.setItem(MINER_IMPORT_STORAGE_KEY, serializeMinerImport(items));
    } else localStorage.removeItem(MINER_IMPORT_STORAGE_KEY);
    window.dispatchEvent(new Event(MINER_IMPORT_CHANGE_EVENT));
}

export function parseMinerImport(text: string): ImportedMiner[] {
    if (text.length > 2_000_000) throw new Error('Import too large');
    const source = text.trim();
    let items: ImportedMiner[];
    if (/^[{[]/.test(source)) {
        const json: unknown = JSON.parse(source);
        const root = Array.isArray(json) ? { items: json } : record(json);
        if (root.success === false) throw new Error('Unsuccessful inventory response');
        const data = root.data === undefined ? root : record(root.data);
        if (!Array.isArray(data.items)) throw new Error('Missing inventory items');
        items = data.items.map(value => {
            const item = record(value);
            if (typeof item.miner_id !== 'string' || !/^[a-f\d]{24}$/i.test(item.miner_id)
                || typeof item.name !== 'string' || !item.name.trim()
                || typeof item.power !== 'number' || !Number.isFinite(item.power) || item.power < 0
                || typeof item.bonus_percent !== 'number' || !Number.isFinite(item.bonus_percent) || item.bonus_percent < 0
                || !Number.isSafeInteger(item.level) || Number(item.level) < 0
                || (item.width !== 1 && item.width !== 2)
                || !isValidMinerFilename(item.filename)) {
                throw new Error('Invalid inventory miner');
            }
            const miner: MinerDto = {
                id: item.miner_id.toLowerCase(), name: item.name.trim(), power: item.power, percent: item.bonus_percent,
                level: Number(item.level), width: item.width, fileName: item.filename, imageVersion: 1,
                type: typeof item.type === 'string' ? item.type : 'miner', createdDate: '',
            };
            return { id: miner.id, name: miner.name, power: miner.power, percent: miner.percent,
                quantity: item.quantity as number, miner };
        });
    } else {
        const lines = source.split(/\r?\n/).map(line => line.trim().replace(/\\$/, '').trim()).filter(Boolean);
        const ids = lines.flatMap((line, index) => {
            const match = line.match(/^([a-f\d]{24})\d*$/i);
            return match ? [{ id: match[1].toLowerCase(), index }] : [];
        });
        items = ids.map(({ id, index }, i) => {
            const end = ids[i + 1]?.index ?? lines.length;
            const block = lines.slice(index + 1, end);
            const powerLine = block.find(line => /^(?:[^\d]*[:：]\s*)?\d+(?:[.,]\d+)?\s*[kmgtpezy]?h\s*\/\s*s$/i.test(line));
            const power = powerLine && parseHashPower(powerLine.replace(/^.*[:：]\s*/, '').replace(/\s*\/\s*s$/i, '/s'));
            const beforeId = lines.slice(i ? ids[i - 1].index + 1 : 0, index).join('\n');
            const bonuses = [...beforeId.matchAll(/\+?\s*(\d+(?:[.,]\d+)?)\s*[%％]/g)];
            const bonus = bonuses.at(-1)?.[1] ?? '0';
            if (!power || !block[0] || block[0] === powerLine) throw new Error('Incomplete collection miner');
            const decimals = powerLine.match(/\d+[.,](\d+)/)?.[1].length ?? 0;
            return { id, name: block[0], power: toBaseUnit(power) / 1e9,
                powerToleranceGh: toBaseUnit({ value: 0.5 * 10 ** -decimals, unit: power.unit }) / 1e9,
                percent: Math.round(Number(bonus.replace(',', '.')) * 100), quantity: 1 };
        });
    }
    validateImportedQuantities(items);
    const unique = new Map<string, ImportedMiner>();
    for (const item of items) {
        const previous = unique.get(item.id);
        if (previous && (previous.power !== item.power || previous.percent !== item.percent)) throw new Error('Conflicting miner data');
        unique.set(item.id, { ...item, quantity: (previous?.quantity ?? 0) + item.quantity });
    }
    return [...unique.values()];
}

export function serializeMinerImport(items: ImportedMiner[]): string {
    const serialized = JSON.stringify({ items: items.map(item => {
        if (!item.miner) throw new Error('Unresolved miner');
        return { miner_id: item.id, name: item.name, power: item.power, bonus_percent: item.percent,
            quantity: item.quantity, level: item.miner.level, width: item.miner.width,
            filename: item.miner.fileName, type: item.miner.type };
    }) });
    if (serialized.length > 2_000_000) throw new Error('Import too large');
    return serialized;
}

export function placeImportedMiners(room: RollercoinRoomResponse, items: ImportedMiner[]): RollercoinRoomResponse {
    validateImportedQuantities(items);
    if (!items.some(item => item.quantity > 0)) throw new Error('No miners available');
    const miners = [...room.miners];
    // Place wide miners first so one-cell miners do not fragment free rows.
    for (const item of [...items].sort((a, b) => (b.miner?.width ?? 0) - (a.miner?.width ?? 0))) {
        const miner = item.miner;
        if (!miner) throw new Error('Unresolved miner');
        for (let copy = 0; copy < item.quantity; copy++) {
            let placement: ApiRoomMiner['placement'] = null;
            for (const rack of room.racks ?? []) {
                const height = rack.rack_info?.height ?? Math.ceil((rack.cells ?? 0) / 2);
                for (let y = 0; y < height && !placement; y++) {
                    for (let x = 0; x <= 2 - miner.width; x++) {
                        const occupied = miners.some(m => m.placement?.user_rack_id === rack._id && m.placement.y === y
                            && x < m.placement.x + m.width && x + miner.width > m.placement.x);
                        if (!occupied) { placement = { user_rack_id: rack._id, x, y }; break; }
                    }
                }
                if (placement) break;
            }
            if (!placement) throw new Error('Insufficient room capacity');
            miners.push({ _id: `import_${crypto.randomUUID()}`, miner_id: item.id, name: item.name,
                power: item.power, bonus_percent: item.percent, width: miner.width, level: miner.level,
                type: miner.type ?? 'miner', filename: miner.fileName ?? '', updated: new Date().toISOString(),
                is_in_set: false, placement });
        }
    }
    return { ...room, miners };
}
