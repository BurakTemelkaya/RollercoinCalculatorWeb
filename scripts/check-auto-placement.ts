import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { optimizeRoomPlacement, type AutoPlacementOptions } from '../src/utils/autoPlacement';
import { calculateExactRoomPower } from '../src/utils/roomParser';
import { isMinerInRackSet } from '../src/utils/rackSetCatalog';
import { adjustImportedQuantities, parseMinerImport, serializeMinerImport, type ImportedMiner } from '../src/utils/minerImport';
import { SETS_DATA } from '../src/data/sets';
import type { ApiRoomMiner, ApiRoomRack, RollercoinRoomResponse } from '../src/types/room';
import type { GetRackSetListDto } from '../src/services/rackApi';

const id = (n: number) => n.toString(16).padStart(24, '0');
const miner = (n: number, power: number, width = 2, bonus = 0): ApiRoomMiner => ({
    _id: `instance-${n}`, miner_id: id(n), name: `Miner ${n}`, filename: `miner_${n}`, power,
    width, bonus_percent: bonus, level: 0, type: 'basic', is_in_set: false, updated: '', placement: null,
});
const rack = (n: number, cells = 2, bonus = 0): ApiRoomRack => ({
    _id: `rack-${n}`, rack_id: id(100 + n), name: `Rack ${n}`, cells, bonus_percent: bonus,
    type: 'rack', placement: { user_room_id: `room-${n % 2}`, x: 0, y: 0 },
});
const room = (racks: ApiRoomRack[], miners: ApiRoomMiner[] = []): RollercoinRoomResponse => ({
    is_user_from_session: false, racks, miners,
    rooms: [0, 1].map(n => ({ _id: `room-${n}`, room_info: { room_id: 'type', level: 1, cols: 8, rows: 3 } })),
});
const stock = (m: ApiRoomMiner, quantity = 1): ImportedMiner => ({
    id: m.miner_id, name: m.name, power: m.power, percent: m.bonus_percent, quantity,
    miner: { id: m.miner_id, name: m.name, power: m.power, percent: m.bonus_percent, width: m.width,
        level: m.level, fileName: m.filename, type: m.type, imageVersion: 1, createdDate: '' },
});
function validate(input: RollercoinRoomResponse, inventory: ImportedMiner[], result: ReturnType<typeof optimizeRoomPlacement>, sets?: GetRackSetListDto[], limit?: number) {
    if (result.mode === 'optimal' && (limit === undefined || result.beforePower <= limit)) assert(result.afterPower >= result.beforePower, 'Optimization must not reduce power when the baseline meets the limit');
    if (limit !== undefined) { assert(result.limitSatisfied); assert(result.afterPower <= limit, 'Power cap must never be exceeded'); }
    assert.equal(result.afterPower, calculateExactRoomPower(result.room, sets).totalLeaguePowerGh);
    const counts = (r: RollercoinRoomResponse, list: ImportedMiner[]) => {
        const map = new Map<string, number>();
        for (const m of r.miners) map.set(m.miner_id, (map.get(m.miner_id) ?? 0) + 1);
        for (const m of list) map.set(m.id, (map.get(m.id) ?? 0) + m.quantity);
        return [...map].filter(([, count]) => count !== 0).sort(([a], [b]) => a.localeCompare(b));
    };
    assert.deepEqual(counts(input, inventory), counts(result.room, result.inventory), 'Owned miner counts must be conserved');
    assert.equal(new Set(result.room.miners.map(m => m._id)).size, result.room.miners.length);
    const occupied = new Set<string>();
    for (const m of result.room.miners) {
        if (!m.placement) continue;
        const r = result.room.racks!.find(r => r._id === m.placement!.user_rack_id)!;
        assert(r, 'Unknown rack');
        assert(m.placement.x >= 0 && m.placement.x + m.width <= 2);
        for (let x = m.placement.x; x < m.placement.x + m.width; x++) {
            const cell = m.placement.y * 2 + x;
            const capacity = r.cells ?? r.rack_info?.capacity ?? r.rack_info!.width * r.rack_info!.height;
            assert(cell >= 0 && cell < capacity, 'Capacity exceeded');
            const key = `${r._id}:${cell}`;
            assert(!occupied.has(key), 'Overlapping miners');
            occupied.add(key);
        }
    }
    assert(result.inventory.every(m => Number.isSafeInteger(m.quantity) && m.quantity >= 0));
    assert.deepEqual(result.room.racks, input.racks, 'Racks must not change');
    assert.deepEqual(result.room.rooms, input.rooms, 'Rooms must not change');
}

const strong = { ...miner(1, 100), placement: { user_rack_id: 'rack-0', x: 0, y: 0 } };
const weak = { ...miner(2, 10), placement: { user_rack_id: 'rack-1', x: 0, y: 0 } };
const initial = room([rack(0), rack(1, 2, 1000)], [strong, weak]);
const inventory = [stock(miner(3, 500))];
const snapshot = JSON.stringify({ initial, inventory });
const lockedRoom = room([rack(0, 4), rack(1, 2, 1000)], [
    { ...strong, placement: { user_rack_id: 'rack-0', x: 0, y: 1 } },
    { ...weak, placement: { user_rack_id: 'rack-1', x: 0, y: 0 } },
]);
const locked = optimizeRoomPlacement(lockedRoom, inventory, undefined, undefined, { keepPlaced: true });
validate(lockedRoom, inventory, locked);
for (const original of lockedRoom.miners) assert.deepEqual(locked.room.miners.find(m => m._id === original._id), original,
    'Fill-only placement must preserve every existing miner, its exact coordinates and metadata');
assert(locked.changes.every(change => !change.from && change.to), 'Fill-only results must contain additions only');
assert.equal(locked.inventory.find(m => m.id === id(3))!.quantity, 0);
const noMove = optimizeRoomPlacement(lockedRoom, inventory, undefined, undefined, { noMovePlaced: true });
validate(lockedRoom, inventory, noMove);
assert.equal(noMove.afterPower, 650, 'No-move mode must still replace a weak miner');
assert.deepEqual(noMove.room.miners.find(m => m._id === strong._id), lockedRoom.miners[0], 'Surviving miners must keep their exact row and column');
assert.equal(noMove.inventory.find(m => m.id === weak.miner_id)!.quantity, 1);
assert(noMove.changes.every(change => !change.from || !change.to), 'A no-move result may only add and remove');
const noRelocationRoom = room([rack(0), rack(1, 2, 10000)], [strong]);
assert.deepEqual(optimizeRoomPlacement(noRelocationRoom, [], undefined, undefined, { noMovePlaced: true }).room, noRelocationRoom,
    'Removed room miners must not become stock that can be moved to a stronger rack in the same operation');
const collisionRoom = { ...noRelocationRoom, miners: [{ ...strong, _id: `auto_${strong.miner_id}_0` }] };
const replacedCopy = optimizeRoomPlacement(collisionRoom, [stock(strong)], undefined, 200, { noMovePlaced: true });
validate(collisionRoom, [stock(strong)], replacedCopy, undefined, 200);
assert.equal(replacedCopy.afterPower, 200);
assert(!replacedCopy.room.miners.some(m => m._id === collisionRoom.miners[0]._id), 'A stock copy must not reuse the removed original instance ID');
assert(replacedCopy.changes.every(change => !change.from || !change.to));
const noMoveZero = optimizeRoomPlacement(lockedRoom, inventory, undefined, 0, { noMovePlaced: true });
assert.equal(noMoveZero.afterPower, 0);
assert(noMoveZero.changes.every(change => change.from && !change.to), 'No-move mode must be allowed to remove miners under a lower cap');
const fragmentedRoom = room([rack(0, 4)], [
    { ...miner(601, 1, 1), placement: { user_rack_id: 'rack-0', x: 0, y: 0 } },
    { ...miner(602, 1, 1), placement: { user_rack_id: 'rack-0', x: 1, y: 1 } },
]);
const fragmented = optimizeRoomPlacement(fragmentedRoom, [stock(miner(603, 1000, 2))], undefined, undefined, { keepPlaced: true });
assert.deepEqual(fragmented.room, fragmentedRoom, 'Two separate single-cell holes cannot fit a two-cell miner');
assert.equal(fragmented.inventory[0].quantity, 1);
const duplicateFragments = { ...fragmentedRoom, miners: fragmentedRoom.miners.map((m, index) => ({
    ...fragmentedRoom.miners[0], _id: `duplicate-${index}`, placement: m.placement,
})) };
const duplicateNoMove = optimizeRoomPlacement(duplicateFragments, [stock(miner(603, 1000, 2))], undefined, undefined, { noMovePlaced: true });
validate(duplicateFragments, [stock(miner(603, 1000, 2))], duplicateNoMove);
assert.equal(duplicateNoMove.afterPower, 1001);
for (const original of duplicateFragments.miners) {
    const retained = duplicateNoMove.room.miners.find(m => m._id === original._id);
    if (retained) assert.deepEqual(retained, original, 'Duplicate models must retain the correct original instance and cell');
}
const lockedOverCap = optimizeRoomPlacement(lockedRoom, inventory, undefined, 0, { keepPlaced: true });
assert.equal(lockedOverCap.limitSatisfied, false);
assert.deepEqual(lockedOverCap.room, lockedRoom, 'A lower limit must not remove locked miners');
const modeRoom = room([rack(0)]);
const modeStock = [stock(miner(610, 900)), stock(miner(611, 100, 2, 30000)), stock(miner(612, 800, 2, 20000))];
for (const [mode, expectedModel] of [['power', 610], ['bonus', 611], ['optimal', 612]] as const) {
    const answer = optimizeRoomPlacement(modeRoom, modeStock, undefined, undefined, { mode });
    validate(modeRoom, modeStock, answer);
    assert.equal(answer.room.miners[0].miner_id, id(expectedModel), `${mode} must optimize its own metric`);
    assert.equal(answer.mode, mode);
}
const reducedLeague = optimizeRoomPlacement(room([rack(0)], [{ ...miner(612, 800, 2, 20000), placement: strong.placement }]),
    modeStock.slice(0, 1), undefined, undefined, { mode: 'power' });
assert.equal(reducedLeague.afterPower, 900, 'Power mode may reduce league power to increase raw power');
assert.equal(reducedLeague.afterObjective, 900);
assert.equal(reducedLeague.beforeObjective, 800);
for (const mode of ['power', 'bonus', 'optimal'] as const) {
    const capped = optimizeRoomPlacement(modeRoom, modeStock, undefined, 500, { mode });
    assert.equal(capped.afterPower, 400, `${mode} must obey the league power cap, not a raw-power cap`);
}
const result = optimizeRoomPlacement(initial, inventory);
validate(initial, inventory, result);
assert.equal(result.afterPower, 650);
assert.equal(result.room.miners.find(m => m.miner_id === id(3))?.placement?.user_rack_id, 'rack-1');
assert.equal(result.inventory.find(m => m.id === id(2))?.quantity, 1, 'Displaced miner must return to inventory');
assert.equal(result.inventory.find(m => m.id === id(3))?.quantity, 0, 'Consumed stock must stay as a zero card');
assert.equal(JSON.stringify({ initial, inventory }), snapshot, 'Inputs must not be mutated');
assert(result.exact);
const undoneStock = adjustImportedQuantities(result.inventory, result.stockChanges, 1);
assert.equal(undoneStock.find(m => m.id === id(3))?.quantity, 1);
assert.equal(undoneStock.find(m => m.id === id(2))?.quantity, 0);
assert.throws(() => adjustImportedQuantities(result.inventory.map(m => ({ ...m, quantity: 0 })), result.stockChanges, 1), undefined,
    'Undo must reject a returned miner that has already been spent');
const again = optimizeRoomPlacement(result.room, result.inventory);
assert.deepEqual(again.room, result.room, 'Running again must not shuffle an equally good layout');
assert.equal(again.changes.length, 0);
for (const [limit, expected] of [[650, 650], [649, 610], [300, 120], [110, 110], [100, 100], [0, 0]]) {
    const capped = optimizeRoomPlacement(initial, inventory, undefined, limit);
    validate(initial, inventory, capped, undefined, limit);
    assert.equal(capped.afterPower, expected, `Best power under ${limit} Gh/s`);
}
for (const limit of [-1, NaN, Infinity]) assert.throws(() => optimizeRoomPlacement(initial, inventory, undefined, limit));
const fullStock = [stock(miner(403, 500), 10000)];
const infeasible = optimizeRoomPlacement(room([rack(0)], [strong]), fullStock, undefined, 0);
assert.equal(infeasible.limitSatisfied, false, 'Inventory capacity can make a cap infeasible');
assert.deepEqual(infeasible.room.miners, [strong], 'An infeasible cap must preserve the room and stock');
assert.deepEqual(infeasible.inventory, fullStock);

const azureDragon = { ...miner(400, 100), filename: '青火龙_(azure_dragon)', name: '青火龙 (Azure Dragon)',
    placement: { user_rack_id: 'rack-0', x: 0, y: 0 } };
const dragonRoom = room([rack(0)], [azureDragon]);
const dragonStock = [stock(miner(401, 500))];
const dragonResult = optimizeRoomPlacement(dragonRoom, dragonStock);
validate(dragonRoom, dragonStock, dragonResult);
const savedDragon = parseMinerImport(serializeMinerImport(dragonResult.inventory)).find(m => m.id === azureDragon.miner_id)!;
assert.equal(savedDragon.miner?.fileName, azureDragon.filename, 'Localized filenames must survive displacement and storage');
assert.equal(savedDragon.quantity, 1);

const nativeRack = { _id: 'rack-0', rack_id: id(100), name: 'Regular Rack 8', bonus: 1000,
    placement: { user_room_id: 'room-0', x: 0, y: 0 }, rack_info: { width: 2, height: 4 } };
const nativeRoom = room([nativeRack]);
const nativeStock = [stock(miner(402, 100), 5)];
const nativeResult = optimizeRoomPlacement(nativeRoom, nativeStock);
validate(nativeRoom, nativeStock, nativeResult);
assert.equal(nativeResult.afterPower, 440, 'API rack dimensions must provide capacity and bonus');
assert.equal(nativeResult.room.miners.length, 4, 'A 2-by-4 rack holds four wide miners');
assert.equal(nativeResult.inventory[0].quantity, 1);
assert.deepEqual(nativeResult.room.racks, nativeRoom.racks, 'Resolving dimensions must not modify the source racks');
const limitedNativeRoom = room([{ ...nativeRack, rack_info: { ...nativeRack.rack_info, capacity: 6 } }]);
const limitedNativeResult = optimizeRoomPlacement(limitedNativeRoom, nativeStock);
validate(limitedNativeRoom, nativeStock, limitedNativeResult);
assert.equal(limitedNativeResult.afterPower, 330, 'Explicit rack capacity must limit the dimension-based fallback');
for (const info of [{ width: 3, height: 4 }, { width: 2, height: -1 }, { width: 2, height: 1.5 }]) {
    assert.throws(() => optimizeRoomPlacement(room([{ ...nativeRack, rack_info: info }]), nativeStock));
}
assert.throws(() => optimizeRoomPlacement(room([{ ...nativeRack, cells: 10 }]), nativeStock), undefined,
    'Explicit capacity cannot exceed physical rack dimensions');

const duplicateInventory = [stock(miner(4, 100, 1, 1000), 2)];
const duplicateRoom = room([rack(0)]);
assert.equal(optimizeRoomPlacement(duplicateRoom, duplicateInventory).afterPower, 220, 'Duplicate models grant their bonus once');
const bonusInventory = [stock(miner(5, 1000)), stock(miner(6, 1, 1, 10000)), stock(miner(7, 500, 1))];
assert.equal(optimizeRoomPlacement(duplicateRoom, bonusInventory).afterPower, 1002, 'Collection bonus and width can beat raw power');

const a = miner(8, 1), b = miner(9, 1), outside = miner(10, 1000), ordinary = miner(11, 600);
const setRack = rack(0, 4);
const sets: GetRackSetListDto[] = [{ id: 'set', name: 'Test set', requiredRackId: setRack.rack_id,
    requiredRack: { id: setRack.rack_id, name: setRack.name, capacity: 4, powerBonus: 0, createdDate: '' },
    rackSetItems: [a, b].map(m => ({ minerSetId: 'set', minerId: m.miner_id, minerFilename: m.filename })),
    rackSetLevels: [{ id: 'level', minerSetId: 'set', level: 1, requiredUniqueMiners: 2,
        conditionAmount: 2, conditionType: 'unique_miner', bonusPercent: 30000 }],
}];
const setRoom = room([setRack, rack(1)]);
const setStock = [stock(a), stock(b), stock(outside), stock(ordinary, 2)];
const setResult = optimizeRoomPlacement(setRoom, setStock, sets);
validate(setRoom, setStock, setResult, sets);
assert.equal(setResult.afterPower, 4008, 'A complete set can outweigh stronger individual miners');
assert.equal(calculateExactRoomPower(setResult.room, sets).setBonusPercent, 30000);
const abundantSetStock = setStock.map(m => ({ ...m, quantity: 10 }));
const boundedSetResult = optimizeRoomPlacement(setRoom, abundantSetStock, sets);
validate(setRoom, abundantSetStock, boundedSetResult, sets);
assert(!boundedSetResult.exact);
assert.equal(boundedSetResult.afterPower, 4008, 'Bounded search must cross a set threshold even when single replacements lose power');
const repeatedFilenameStock = abundantSetStock.map(m => m.id === b.miner_id
    ? { ...m, miner: { ...m.miner!, fileName: a.filename } } : m);
const repeatedFilenameResult = optimizeRoomPlacement(setRoom, repeatedFilenameStock, sets);
validate(setRoom, repeatedFilenameStock, repeatedFilenameResult, sets);
assert.equal(repeatedFilenameResult.afterPower, 3000, 'Different model IDs sharing a filename must not unlock a second set tier');

// Independent cell-by-cell brute force: no allocator or scoring shortcut from the optimizer.
function oracle(r: RollercoinRoomResponse, list: ImportedMiner[], dynamic?: GetRackSetListDto[], limit = Infinity, options: AutoPlacementOptions = {}) {
    const copies = [...r.miners.filter(m => !options.keepPlaced || !m.placement).map(m => ({ ...m, placement: null })), ...list.flatMap(item => Array.from({ length: item.quantity }, (_, i) => ({
        ...miner(9000 + i, item.power, item.miner!.width, item.percent), miner_id: item.id,
        filename: item.miner!.fileName!, name: item.name,
    })))];
    const placed: ApiRoomMiner[] = options.keepPlaced ? r.miners.filter(m => m.placement) : [];
    let best = -Infinity;
    function visit(index: number) {
        if (index === copies.length) {
            const stats = calculateExactRoomPower({ ...r, miners: placed }, dynamic);
            const score = options.mode === 'power' ? stats.baseMinerPowerGh : options.mode === 'bonus' ? stats.collectionBonusPercent : stats.totalLeaguePowerGh;
            if (stats.totalLeaguePowerGh <= limit) best = Math.max(best, score);
            return;
        }
        visit(index + 1);
        const m = copies[index];
        const anchored = options.noMovePlaced ? r.miners.find(original => original._id === m._id)?.placement : undefined;
        for (const ra of r.racks!) for (let cell = 0, cells = ra.cells ?? ra.rack_info?.capacity ?? ra.rack_info!.width * ra.rack_info!.height; cell < cells; cell++) {
            const x = cell % 2, y = Math.floor(cell / 2);
            if (anchored && (anchored.user_rack_id !== ra._id || anchored.x !== x || anchored.y !== y)) continue;
            if (x + m.width > 2 || cell + m.width > cells) continue;
            if (placed.some(p => p.placement!.user_rack_id === ra._id && p.placement!.y === y
                && x < p.placement!.x + p.width && x + m.width > p.placement!.x)) continue;
            placed.push({ ...m, _id: `oracle-${index}`, placement: { user_rack_id: ra._id, x, y },
                is_in_set: isMinerInRackSet(ra, m.miner_id, m.filename, dynamic) });
            visit(index + 1); placed.pop();
        }
    }
    visit(0); return best;
}
let randomSeed = 20261020;
const random = (max: number) => { randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0; return randomSeed % max; };
const partialSetRoom = { ...setRoom, miners: [{ ...a, is_in_set: true, placement: { user_rack_id: setRack._id, x: 0, y: 1 } }] };
const partialSetStock = setStock.filter(item => item.id !== a.miner_id);
for (const mode of ['power', 'bonus', 'optimal'] as const) for (const keepPlaced of [false, true]) for (const cap of [undefined, 3000]) {
    const options = { mode, keepPlaced };
    const answer = optimizeRoomPlacement(partialSetRoom, partialSetStock, sets, cap, options);
    validate(partialSetRoom, partialSetStock, answer, sets, cap);
    assert.equal(answer.afterObjective, oracle(partialSetRoom, partialSetStock, sets, cap, options), 'Set thresholds and league caps must work with every priority and placement policy');
    if (keepPlaced) assert.deepEqual(answer.room.miners.find(m => m._id === a._id), partialSetRoom.miners[0]);
}
for (const mode of ['power', 'bonus', 'optimal'] as const) for (const cap of [undefined, 3000]) {
    const options = { mode, noMovePlaced: true };
    const answer = optimizeRoomPlacement(partialSetRoom, partialSetStock, sets, cap, options);
    validate(partialSetRoom, partialSetStock, answer, sets, cap);
    assert.equal(answer.afterObjective, oracle(partialSetRoom, partialSetStock, sets, cap, options));
    assert(answer.changes.every(change => !change.from || !change.to));
}
for (let test = 0; test < 20; test++) {
    const existing = { ...miner(700, 10 + random(100), 1, random(10) * 100), placement: { user_rack_id: 'rack-0', x: random(2), y: 1 } };
    const r = room([rack(0, 4, 1000), rack(1, 2, 500)], [existing]);
    const list = [stock(existing), ...Array.from({ length: 2 }, (_, n) => stock(miner(701 + n, random(700), 1 + random(2), random(20) * 100)))];
    const cap = Math.floor(oracle(r, list) * 0.7);
    for (const keepPlaced of [false, true]) for (const mode of ['power', 'bonus', 'optimal'] as const) for (const max of [undefined, cap]) {
        const options = { mode, keepPlaced };
        const expected = oracle(r, list, undefined, max, options);
        const answer = optimizeRoomPlacement(r, list, undefined, max, options);
        if (expected === -Infinity) { assert.equal(answer.limitSatisfied, false); assert.deepEqual(answer.room, r); continue; }
        validate(r, list, answer, undefined, max);
        assert.equal(answer.afterObjective, expected, `Objective mismatch: case ${test}, ${mode}, locked=${keepPlaced}, cap=${max}`);
        if (keepPlaced) assert.deepEqual(answer.room.miners.find(m => m._id === existing._id), existing);
    }
}
const boundedLockedRoom = room(Array.from({ length: 4 }, (_, n) => rack(n, 8, n * 100)));
for (let test = 0; test < 15; test++) {
    const r = room([rack(0, 4, 1000), rack(1, 2, 500)], [
        { ...miner(800, 10 + random(100), 1, random(10) * 100), placement: { user_rack_id: 'rack-0', x: 0, y: 0 } },
        { ...miner(801, 10 + random(100), 1, random(10) * 100), placement: { user_rack_id: 'rack-0', x: 1, y: 1 } },
    ]);
    const list = Array.from({ length: 2 }, (_, n) => stock(miner(802 + n, random(500), 1 + random(2), random(20) * 100)));
    for (const mode of ['power', 'bonus', 'optimal'] as const) for (const cap of [undefined, 500]) {
        const options = { mode, noMovePlaced: true };
        const expected = oracle(r, list, undefined, cap, options);
        const answer = optimizeRoomPlacement(r, list, undefined, cap, options);
        validate(r, list, answer, undefined, cap);
        assert.equal(answer.afterObjective, expected, `Anchored mismatch ${test}, ${mode}, cap=${cap}`);
        assert(answer.changes.every(change => !change.from || !change.to));
        for (const original of r.miners) {
            const retained = answer.room.miners.find(m => m._id === original._id);
            if (retained) assert.deepEqual(retained, original);
        }
    }
}
boundedLockedRoom.miners = boundedLockedRoom.racks!.map((r, n) => ({ ...miner(720 + n, 100, 1, 100),
    placement: { user_rack_id: r._id, x: n % 2, y: 2 } }));
const boundedLockedStock = Array.from({ length: 15 }, (_, n) => stock(miner(730 + n, 100 + random(2000), 1 + random(2), random(20) * 100), 3));
for (const mode of ['power', 'bonus', 'optimal'] as const) {
    const answer = optimizeRoomPlacement(boundedLockedRoom, boundedLockedStock, undefined, 30000, { mode, keepPlaced: true });
    validate(boundedLockedRoom, boundedLockedStock, answer, undefined, 30000);
    assert.equal(answer.exact, false);
    for (const existing of boundedLockedRoom.miners) assert.deepEqual(answer.room.miners.find(m => m._id === existing._id), existing);
    assert(answer.changes.every(change => !change.from && change.to));
    const noMoveAnswer = optimizeRoomPlacement(boundedLockedRoom, boundedLockedStock, undefined, 30000, { mode, noMovePlaced: true });
    validate(boundedLockedRoom, boundedLockedStock, noMoveAnswer, undefined, 30000);
    assert.equal(noMoveAnswer.exact, false);
    assert(noMoveAnswer.changes.every(change => !change.from || !change.to));
    for (const original of boundedLockedRoom.miners) {
        const retained = noMoveAnswer.room.miners.find(m => m._id === original._id);
        if (retained) assert.deepEqual(retained, original);
    }
}
assert.throws(() => optimizeRoomPlacement(initial, inventory, undefined, undefined, { mode: 'invalid' as never }));
assert.throws(() => optimizeRoomPlacement(initial, inventory, undefined, undefined, { keepPlaced: 'yes' as never }));
assert.throws(() => optimizeRoomPlacement(initial, inventory, undefined, undefined, { noMovePlaced: 'yes' as never }));
for (let test = 0; test < 70; test++) {
    const r = room([rack(0, 2 + 2 * random(2), random(6) * 100), rack(1, 2, random(6) * 100)]);
    const list = Array.from({ length: 2 + random(3) }, (_, i) => stock(miner(20 + i, random(400), 1 + random(2), random(12) * 100)));
    const answer = optimizeRoomPlacement(r, list);
    validate(r, list, answer);
    assert(answer.exact);
    assert(Math.abs(answer.afterPower - oracle(r, list)) < 1e-8, `Brute-force mismatch in case ${test}`);
    assert.deepEqual(optimizeRoomPlacement(r, list), answer, 'Deterministic result');
}
for (let test = 0; test < 35; test++) {
    const r = room([rack(0, 3 + random(2), random(6) * 100), rack(1, 2, random(6) * 100)]);
    const list = Array.from({ length: 4 }, (_, i) => stock(miner(200 + i, random(400), 1 + random(2), random(12) * 100)));
    list[0].quantity = 2;
    // Two different model levels sharing a filename only count once toward a set.
    list[1].miner!.fileName = list[0].miner!.fileName;
    const dynamic = structuredClone(sets);
    dynamic[0].rackSetItems = list.slice(0, 3).map(m => ({ minerSetId: 'set', minerId: m.id, minerFilename: m.miner!.fileName! }));
    dynamic[0].rackSetLevels = [1, 2].map(n => ({ ...sets[0].rackSetLevels[0], id: `level-${n}`, conditionAmount: n,
        bonusPercent: (1 + random(10)) * 1000 }));
    if (test % 2) {
        const original = { ...miner(200, list[0].power, list[0].miner!.width, list[0].percent),
            placement: { user_rack_id: 'rack-1', x: 0, y: 0 } };
        r.miners.push(original);
        list[0].quantity--;
    }
    const answer = optimizeRoomPlacement(r, list, dynamic);
    validate(r, list, answer, dynamic);
    assert(answer.exact);
    assert(Math.abs(answer.afterPower - oracle(r, list, dynamic)) < 1e-8, `Set brute-force mismatch in case ${test}`);
    const limit = Math.floor(answer.afterPower * 0.7);
    const capped = optimizeRoomPlacement(r, list, dynamic, limit);
    validate(r, list, capped, dynamic, limit);
    assert(Math.abs(capped.afterPower - oracle(r, list, dynamic, limit)) < 1e-8, `Capped set mismatch in case ${test}`);
}
for (let test = 0; test < 40; test++) {
    const existing = { ...miner(500, 100 + random(100)), placement: { user_rack_id: 'rack-0', x: 0, y: 0 } };
    const r = room([rack(0, 2, 1000), rack(1, 3, 500)], [existing]);
    const list = Array.from({ length: 3 }, (_, i) => stock(miner(501 + i, random(700), 1 + random(2), random(15) * 100)));
    const limit = random(1200);
    const answer = optimizeRoomPlacement(r, list, undefined, limit);
    validate(r, list, answer, undefined, limit);
    assert.equal(answer.exact, true);
    assert(Math.abs(answer.afterPower - oracle(r, list, undefined, limit)) < 1e-8, `Capped oracle mismatch in case ${test}`);
}
const local = SETS_DATA.find(s => s.rack && s.miners && s.miners.length >= 2 && s.levels.some(l => l.condition_amount <= 2))!;
const localStock = [...new Map(local.miners!.map(m => [m.filename, m])).values()].slice(0, 2)
    .map((m, i) => stock({ ...miner(300 + i, 100, 1), filename: m.filename, name: m.title.en }));
localStock.push(stock(miner(302, 2000)));
const localRoom = room([{ ...rack(0, 2), rack_id: local.rack!.id, name: local.rack!.title.en }, rack(1, 2)]);
const localAnswer = optimizeRoomPlacement(localRoom, localStock);
validate(localRoom, localStock, localAnswer);
assert.equal(localAnswer.afterPower, oracle(localRoom, localStock), 'Local set fallback must match the canonical calculation');
assert(calculateExactRoomPower(localAnswer.room).setBonusPercent > 0);
for (const bad of [room([rack(0, -2)]), room([rack(0)], [{ ...strong, width: 3 }]),
    room([rack(0)], [strong, { ...weak, placement: strong.placement }]),
    room([rack(0)], [{ ...strong, power: NaN }])]) {
    assert.throws(() => optimizeRoomPlacement(bad, []));
}
assert.throws(() => optimizeRoomPlacement(initial, [stock({ ...strong, power: 999 })]), undefined, 'Conflicting model metadata must be rejected');
assert.throws(() => optimizeRoomPlacement(initial, [stock(a), stock(a)]), undefined, 'Duplicate inventory IDs must be rejected');
assert.throws(() => optimizeRoomPlacement(room([rack(0), { ...rack(0), placement: null }]), []), undefined,
    'Unplaced racks must not hide a duplicate rack ID');
const unplacedRoom = room([rack(0)], [miner(310, 999)]);
const unplacedAnswer = optimizeRoomPlacement(unplacedRoom, []);
validate(unplacedRoom, [], unplacedAnswer);
assert.equal(unplacedAnswer.afterPower, 999, 'Unplaced owned miners must also be available');
const zeroStock = [stock(a, 0)];
assert.deepEqual(optimizeRoomPlacement(duplicateRoom, zeroStock).inventory, zeroStock);
const empty = room([]);
assert.deepEqual(optimizeRoomPlacement(empty, [stock(a)]).room, empty);

for (let test = 0; test < 30; test++) {
    const r = room(Array.from({ length: 4 }, (_, i) => rack(i, 8, random(15) * 100)));
    const list = Array.from({ length: 15 }, (_, i) => stock(miner(40 + i, random(10000), 1 + random(2), random(30) * 100), 1 + random(3)));
    const answer = optimizeRoomPlacement(r, list);
    validate(r, list, answer);
    const repeated = optimizeRoomPlacement(answer.room, answer.inventory);
    validate(answer.room, answer.inventory, repeated);
    assert(repeated.afterPower >= answer.afterPower);
}
const bigRoom = room(Array.from({ length: 32 }, (_, i) => rack(i, 8, i * 100)));
const bigStock = Array.from({ length: 1000 }, (_, i) => stock(miner(1000 + i, 1000 + random(1_000_000), 1 + random(2), random(1000)), 10));
const start = performance.now();
const bigResult = optimizeRoomPlacement(bigRoom, bigStock);
validate(bigRoom, bigStock, bigResult);
const bigLimit = bigResult.afterPower * 0.63;
const bigCapped = optimizeRoomPlacement(bigRoom, bigStock, undefined, bigLimit);
validate(bigRoom, bigStock, bigCapped, undefined, bigLimit);
for (const mode of ['power', 'bonus'] as const) {
    const answer = optimizeRoomPlacement(bigRoom, bigStock, undefined, bigLimit, { mode });
    validate(bigRoom, bigStock, answer, undefined, bigLimit);
    assert.equal(answer.mode, mode);
}
assert(performance.now() - start < 15000, 'Large inventory must complete within a bounded time');
console.log(`Auto placement: 528 brute-force oracles across modes/placement policies/caps/sets, anchored duplicate IDs and geometry, 30 randomized round trips and 10,000-stock benchmark passed (${Math.round(performance.now() - start)} ms).`);
