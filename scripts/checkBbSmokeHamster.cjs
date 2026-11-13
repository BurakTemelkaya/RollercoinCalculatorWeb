const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalog = require('../src/data/hamsters.json');
const sets = require('../src/data/hamsterSets.json');
const hamster = catalog.find(item => item.slug === 'bb-smoke');
assert(hamster, 'BB Smoke must be in the catalog');
assert.equal(catalog.filter(item => item.slug === 'bb-smoke').length, 1);
assert.deepEqual(hamster.stats, { health: 50, strength: 70, luck: 90 });
assert.deepEqual(hamster.skins.map(skin => skin.level), [1, 10, 20, 30, 40]);
assert.deepEqual(hamster.abilities.map(item => item.code), ['speed_up_walk', 'extra_loot', 'return_to_work']);
assert.equal(hamster.abilities[1].text.en, 'Extra Loot +25%');
assert.match(hamster.abilities[2].text.en, /20%/);
assert.equal(hamster.ultimate.code, 'remote_power');
assert.deepEqual(hamster.ultimateTiers.map(tier => [tier.chargeRequired, tier.text.en]),
  [[20, 'Miner Power ×4'], [30, 'Miner Power ×5'], [42, 'Miner Power ×7']]);
assert.equal(hamster.animationsPending, false);

const community = sets.find(item => item.slug === 'community-set');
assert.deepEqual(community.members, ['cuscuz', 'chillz', 'bb-smoke']);

for (const skin of hamster.skins) {
  assert.deepEqual(Object.fromEntries(Object.entries(skin.animations).map(([action, item]) => [action, item.frames])), {
    walk: 8, jump: 7, tap_reaction: 10, go_sleep: 24, take_chest: 9, win_loop: 6,
  });
  for (const [file, width, height] of [
    [skin.idle, 160, 160],
    ...Object.values(skin.animations).map(item => [item.path, item.frames * item.frameWidth, item.frameHeight]),
  ]) {
    const png = fs.readFileSync(path.resolve(__dirname, '../public/assets', file));
    assert.equal(png.subarray(1, 4).toString(), 'PNG', file);
    assert.equal(png.readUInt32BE(16), width, file);
    assert.equal(png.readUInt32BE(20), height, file);
  }
}
for (const ability of [...hamster.abilities, hamster.ultimate, ...hamster.ultimateTiers]) {
  assert.equal(Object.keys(ability.text).length, 10);
  for (const text of Object.values(ability.text)) assert(text);
}
for (const language of Object.keys(hamster.ultimate.text)) {
  const guide = require(`../src/locales/${language}.json`).hamsterAbilityGuide;
  assert(guide.descriptions.speedUpWalk && guide.descriptions.overchargedRemotePower && guide.examples.bbSmokeSpeedUps, language);
}
console.log('BB Smoke: stats, five appearances, sprite sheets, abilities, tiers, translations and set membership verified.');
