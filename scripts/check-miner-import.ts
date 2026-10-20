import assert from 'node:assert/strict';
import { adjustImportedQuantities, parseMinerImport, placeImportedMiners, serializeMinerImport } from '../src/utils/minerImport';
import { createEmptyRoom, createManualPowerBaseline, calculateManualPower } from '../src/utils/simulatorBaseline';

const item = { miner_id: '6ac5037623e0c3172662ced4', name: 'Who Dis', filename: 'who_dis',
    quantity: 2, power: 4500000000, bonus_percent: 1500, level: 2, type: 'merge', width: 2 };
const json = JSON.stringify({ success: true, data: { items: [item] } });
const imported = parseMinerImport(json);
assert.equal(imported[0].quantity, 2);
assert.equal(imported[0].miner?.percent, 1500);
assert.deepEqual(parseMinerImport(serializeMinerImport(imported)), imported, 'Saved catalog round trips without another lookup');
const namedSetMiner = parseMinerImport(JSON.stringify({ items: [{ ...item, filename: 'manners_&_mayhem' }] }));
assert.equal(parseMinerImport(serializeMinerImport(namedSetMiner))[0].miner?.fileName, 'manners_&_mayhem',
    'Existing set filenames with ampersands must import and survive reload');
for (const filename of ['青火龙_(azure_dragon)', "don't_stop", 'Türkçe madenci']) {
    const list = parseMinerImport(JSON.stringify({ items: [{ ...item, filename }] }));
    assert.equal(parseMinerImport(serializeMinerImport(list))[0].miner?.fileName, filename);
}
const consumed = adjustImportedQuantities(imported, [{ id: item.miner_id, quantity: 2 }], -1);
assert.equal(consumed[0].quantity, 0);
assert.equal(consumed.length, 1, 'Consumed miners remain in the saved inventory');
assert.equal(parseMinerImport(serializeMinerImport(consumed))[0].quantity, 0, 'Zero stock survives reload');
assert.equal(adjustImportedQuantities(consumed, [{ id: item.miner_id, quantity: 2 }], 1)[0].quantity, 2);
assert.throws(() => adjustImportedQuantities(imported, [{ id: item.miner_id, quantity: 3 }], -1));
assert.deepEqual(adjustImportedQuantities([], [{ id: item.miner_id, quantity: 1 }], 1), [], 'Undo must not resurrect manually deleted cards');
assert.throws(() => serializeMinerImport([{ ...imported[0], name: 'x'.repeat(2_000_000) }]),
    undefined, 'Do not save a list that cannot be read back');
for (const [bonus, sold, power, supply] of [
    ['Bonus güç', 'Satılamaz', 'Güç:', 'Stok:'],
    ['Bonus power', "Can't be sold", 'Power:', 'Supply:'],
    ['加成算力', '不可售', '算力：', '供应量：'],
    ['Poder de bonificación', 'No se puede vender', 'Poder:', 'Suministro:'],
    ['Poder bônus', 'Não pode ser vendido', 'Poder:', 'Abastecimento:'],
    ['Changed label', 'Changed status', 'Changed:', 'Changed:'],
]) {
    const text = `${bonus} +15%\n\n${item.miner_id}2\nWho Dis\n${sold}\n${power}\n4.500 Eh/s\n${supply}\n3495\nDetails\nopen\n${bonus} +3,5%\n6a9aa5dcd8c4c4f046ada3ec1\nDifferent localized name\n${power}\n25,000 Ph/s\n${supply}\n9408`;
    const result = parseMinerImport(text);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, item.miner_id);
    assert.equal(result[0].quantity, 1, 'Supply and the copied ID suffix are not owned quantities');
    assert.equal(result[0].power, item.power);
    assert.equal(result[1].power, 25000000);
    assert.equal(result[1].percent, 350);
}
for (const bad of ['', '{}', '{broken', JSON.stringify({ success: false, data: { items: [item] } }),
    JSON.stringify({ data: { items: [item, { ...item, quantity: -1 }] } }),
    JSON.stringify({ items: [{ ...item, power: '4500' }] }),
    JSON.stringify({ items: [{ ...item, width: 3 }] }),
    ...['../miner', 'miner/file', 'miner\\file', 'miner?query', 'miner#fragment'].map(filename => JSON.stringify({ items: [{ ...item, filename }] })),
    `+15%\n${item.miner_id}\nWho Dis\n-4.500 Eh/s`,
    `+15%\n${item.miner_id}\nWho Dis\n4.500 Eh/s\n0123456789abcdef01234567\nMissing power`]) {
    assert.throws(() => parseMinerImport(bad), undefined, bad);
}
const room = createEmptyRoom();
room.racks = [{ _id: 'rack', rack_id: 'rack-type', name: 'Rack', cells: 8, bonus_percent: 0,
    type: 'rack', placement: { user_room_id: room.rooms![0]._id, x: 0, y: 0 } }];
const placed = placeImportedMiners(room, imported);
assert.equal(room.miners.length, 0, 'Import must not mutate the original room');
assert.equal(placed.miners.length, 2);
assert.deepEqual(placed.miners.map(m => m.placement?.y), [0, 1]);
assert.throws(() => placeImportedMiners(room, [{ ...imported[0], quantity: 5 }]));
assert.equal(room.miners.length, 0, 'Capacity failure leaves the room unchanged');
assert.throws(() => placeImportedMiners(createEmptyRoom(), imported));
const duplicate = { minerId: item.miner_id, power: 100, bonus: 15, rackBonus: 0 };
assert.equal(calculateManualPower(createManualPowerBaseline(0), [duplicate, duplicate]).totalAddedBonusPercent, 15);
assert.equal(calculateManualPower({ ...createManualPowerBaseline(100, 15), minerIds: [item.miner_id] }, [duplicate]).totalAddedBonusPercent, 0);
console.log('Miner import: JSON, five languages, changed labels, validation, placement and unique bonuses passed.');
