import assert from 'node:assert/strict';
import { createRoomOperation, parseRoomOperations, serializeRoomOperations, appendRoomOperation, roomOperationsKey } from '../src/utils/roomOperations';
import { createEmptyRoom } from '../src/utils/simulatorBaseline';
import type { ApiRoomMiner } from '../src/types/room';

const initial = createEmptyRoom();
const miner: ApiRoomMiner = { _id: 'instance', miner_id: 'model', name: 'Who Dis', power: 100, bonus_percent: 1000,
    width: 2, level: 0, type: 'basic', filename: 'who_dis', updated: '', is_in_set: false,
    placement: { user_rack_id: 'rack', x: 0, y: 0 } };
const next = { ...initial, miners: [miner] };
const added = createRoomOperation(initial, next, undefined)!;
assert.equal(added.kind, 'change');
assert.deepEqual(added.changes, [{ entity: 'miner', kind: 'added', count: 1, names: ['Who Dis'], otherNames: 0,
    miners: [{ id: 'instance', name: 'Who Dis' }] }]);
assert.equal(added.beforePowerGh, 0);
assert.equal(added.afterPowerGh, 110);
assert.equal(createRoomOperation(next, structuredClone(next), undefined), null, 'No-op edits must not produce history');
const moved = { ...next, miners: [{ ...miner, placement: { user_rack_id: 'rack', x: 0, y: 1 } }] };
assert.equal(createRoomOperation(next, moved, undefined)!.changes[0].kind, 'moved');
assert.equal(createRoomOperation(next, { ...next, miners: [{ ...miner, power: 200 }] }, undefined)!.changes[0].kind, 'updated');
assert.equal(createRoomOperation(next, initial, undefined, 'undo')!.kind, 'undo');
assert.equal(createRoomOperation(next, initial, undefined, 'reset')!.changes[0].kind, 'removed');
assert.equal(createRoomOperation(next, next, undefined, 'save')!.kind, 'save');
const duplicates = { ...initial, miners: Array.from({ length: 50 }, (_, n) => ({ ...miner, _id: `instance-${n}` })) };
assert.equal(createRoomOperation(initial, duplicates, undefined)!.changes[0].count, 50);
assert.deepEqual(createRoomOperation(initial, duplicates, undefined)!.changes[0].names, ['Who Dis']);
assert.equal(createRoomOperation(initial, duplicates, undefined)!.changes[0].miners!.length, 50,
    'Every duplicate instance must remain individually locatable');
const manyNames = { ...initial, miners: Array.from({ length: 8 }, (_, n) => ({ ...miner, _id: `instance-${n}`, name: `Name ${n}` })) };
const summary = createRoomOperation(initial, manyNames, undefined)!.changes[0];
assert.equal(summary.names.length, 3);
assert.equal(summary.otherNames, 5);
const rackRoom = { ...initial, racks: [{ _id: 'rack', rack_id: 'rack-type', name: 'Regular Rack 8', cells: 8, bonus_percent: 0, placement: null }] };
assert.equal(createRoomOperation(initial, rackRoom, undefined)!.changes[0].entity, 'rack');
assert.equal(createRoomOperation(initial, { ...initial, rooms: [...initial.rooms!, { ...initial.rooms![0], _id: 'second' }] }, undefined)!.changes[0].entity, 'room');
const entries = [added, createRoomOperation(next, initial, undefined, 'reset')!];
assert.deepEqual(parseRoomOperations(serializeRoomOperations(entries)), entries);
const legacy = structuredClone(added);
delete legacy.changes[0].miners;
assert.deepEqual(parseRoomOperations(JSON.stringify([legacy])), [legacy], 'Existing summary-only history must remain readable');
for (const miners of [null, [], [{ id: '', name: 'Who Dis' }], [{ id: 'instance', name: 123 }]]) {
    assert.deepEqual(parseRoomOperations(JSON.stringify([{ ...added, changes: [{ ...added.changes[0], miners }] }])), [],
        'Stored miner references must be validated before rendering');
}
assert.throws(() => serializeRoomOperations([{ ...added, id: 'x'.repeat(2_000_000) }]), undefined,
    'Do not replace saved history with a payload that cannot be loaded again');
for (const bad of ['', '{bad', '{}', JSON.stringify([{ ...added, at: 'yesterday' }]),
    JSON.stringify([{ ...added, afterPowerGh: 'huge' }]), JSON.stringify([{ ...added, kind: 'unknown' }]),
    JSON.stringify([{ ...added, changes: [{ ...added.changes[0], count: -1 }] }])]) assert.deepEqual(parseRoomOperations(bad), []);
let list = entries;
for (let n = 0; n < 120; n++) list = appendRoomOperation(list, { ...added, id: `entry-${n}` });
assert.equal(list.length, 100);
assert.equal(list[0].id, 'entry-119');
assert.notEqual(roomOperationsKey('one'), roomOperationsKey('two'));
assert.notEqual(roomOperationsKey(), roomOperationsKey('one'));
console.log('Room operations: add/move/update/remove, undo/reset/save, rooms/racks, power deltas, compact summaries, persistence validation, account isolation and bounded history passed.');
