const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../src/data/hamsters.json');
const sets = require('../src/data/hamsterSets.json');
const hamster = catalog.find(item => item.slug === 'jack-o-mine');
assert(hamster, 'Jack O’Mine must be in the catalog');
assert.equal(catalog.filter(item => item.slug === hamster.slug).length, 1);
assert.deepEqual(hamster.stats, { health: 70, strength: 60, luck: 90 });
assert.deepEqual(hamster.skins.map(skin => skin.level), [1, 10, 20, 30, 40, 50]);
assert.deepEqual(hamster.ultimateTiers.map(tier => tier.chargeRequired), [18, 24, 30]);
assert.deepEqual(hamster.ultimateTiers.map(tier => tier.text.en), ['Extra Loot +25%', 'Extra Loot +50%', 'Extra Loot +75%']);
assert(sets.find(set => set.slug === 'night-shift-set').members.includes(hamster.slug));
for (const skin of hamster.skins) {
  assert.deepEqual(Object.keys(skin.animations), ['walk']);
  assert.equal(skin.animations.walk.frames, 12);
  assert.equal(skin.idleAnimation.frames * skin.idleAnimation.frameDurationMs, 600);
  assert.equal(skin.idleAnimation.previewRegion, undefined);
  for (const [file, width, height] of [
    [skin.walk, 1536, 128], [skin.idle, 160, 160], [skin.idleAnimation.path, 960, 160],
  ]) {
    const png = fs.readFileSync(path.resolve(__dirname, '../public/assets', file));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), width, file);
    assert.equal(png.readUInt32BE(20), height, file);
  }
}
for (const language of Object.keys(hamster.ultimate.text)) {
  const guide = require(`../src/locales/${language}.json`).hamsterAbilityGuide;
  for (const key of ['skipRestChest', 'overchargedLoot']) assert(guide.descriptions[key], `${language}: ${key}`);
  assert(guide.examples.jackOLoot, `${language}: ultimate example`);
  for (const ability of [...hamster.abilities, hamster.ultimate]) assert(ability.text[language]);
}
console.log('Jack O’Mine: six appearances, assets, abilities, tiers, translations and set membership verified.');
