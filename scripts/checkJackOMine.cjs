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
  assert.deepEqual(Object.keys(skin.animations), ['walk', 'jump', 'tap_reaction', 'go_sleep', 'take_chest', 'win_loop']);
  assert.deepEqual(Object.fromEntries(Object.entries(skin.animations).map(([action, animation]) => [action, animation.frames])), {
    walk: 6, jump: 7, tap_reaction: 15, go_sleep: 24, take_chest: 9, win_loop: 6,
  });
  assert.equal(skin.idleAnimation, undefined);
  for (const [file, width, height] of [
    [skin.walk, 768, 128],
    ...Object.values(skin.animations).map(animation => [animation.path, animation.frames * 128, 128]),
    [skin.idle, 160, 160],
  ]) {
    const png = fs.readFileSync(path.resolve(__dirname, '../public/assets', file));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), width, file);
    assert.equal(png.readUInt32BE(20), height, file);
  }
}
assert.equal(hamster.animationsPending, false);
for (const language of Object.keys(hamster.ultimate.text)) {
  const guide = require(`../src/locales/${language}.json`).hamsterAbilityGuide;
  for (const key of ['skipRestChest', 'overchargedLoot']) assert(guide.descriptions[key], `${language}: ${key}`);
  assert(guide.examples.jackOLoot, `${language}: ultimate example`);
  for (const ability of [...hamster.abilities, hamster.ultimate]) assert(ability.text[language]);
}
console.log('Jack O’Mine: six appearances, assets, abilities, tiers, translations and set membership verified.');
