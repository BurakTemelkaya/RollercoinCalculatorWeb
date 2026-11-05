const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalog = require('../src/data/hamsters.json');
const hamster = catalog.find(item => item.slug === 'chillz');
assert(hamster, 'Chillz must be in the catalog');
assert.equal(catalog.filter(item => item.slug === 'chillz').length, 1);
assert.deepEqual(hamster.stats, { health: 75, strength: 35, luck: 65 });
assert.deepEqual(hamster.skins.map(skin => skin.level), [1]);
assert.equal(hamster.ultimateChargePoints, 24);
assert.equal(hamster.animationsPending, false);

const skin = hamster.skins[0];
assert.deepEqual(Object.fromEntries(Object.entries(skin.animations).map(([action, item]) => [action, item.frames])), {
  walk: 16, jump: 7, tap_reaction: 11, go_sleep: 24, take_chest: 9, win_loop: 6,
});
assert.equal(skin.idleAnimation.frames, 6);
for (const [file, width, height] of [
  [skin.idle, 48, 48],
  [skin.idleAnimation.path, 288, 48],
  ...Object.values(skin.animations).map(item => [item.path, item.frames * item.frameWidth, item.frameHeight]),
  ...hamster.abilities.map(item => [item.icon, null, null]),
  [hamster.ultimate.icon, null, null],
]) {
  const png = fs.readFileSync(path.resolve(__dirname, '../public/assets', file));
  if (file.endsWith('.webp')) assert.equal(png.subarray(8, 12).toString(), 'WEBP', file);
  else assert.equal(png.subarray(1, 4).toString(), 'PNG', file);
  if (width !== null) assert.equal(png.readUInt32BE(16), width, file);
  if (height !== null) assert.equal(png.readUInt32BE(20), height, file);
}
for (const ability of [...hamster.abilities, hamster.ultimate]) {
  assert.equal(Object.keys(ability.text).length, 10);
  for (const language of Object.keys(ability.text)) assert(ability.text[language]);
}
console.log('Chillz: stats, single appearance, six action sheets, idle animation, abilities and translations verified.');
