// Official mechanics: https://rollercoin.com/blog/meet-jack-o-mine
// Run updateHamsterAbilityGuides.cjs first; local GIF-derived assets must already exist.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalogPath = path.resolve(__dirname, '../src/data/hamsters.json');
const setsPath = path.resolve(__dirname, '../src/data/hamsterSets.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
const existing = catalog.find(item => item.slug === 'jack-o-mine');
const loot = catalog.find(item => item.slug === 'joga-bonito').abilities.find(item => item.code === 'extra_loot');
const textForLoot = percent => Object.fromEntries(Object.entries(loot.text).map(([language, text]) => [language, text.replace('15', String(percent))]));
const labels = key => Object.fromEntries(Object.keys(loot.text).map(language => {
  const locale = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../src/locales/${language}.json`), 'utf8'));
  const label = locale.hamsterAbilityGuide.labels[key];
  assert(label, `${language}: missing ${key}`);
  return [language, label];
}));
const skins = [1, 10, 20, 30, 40, 50].map(level => {
  const prefix = `rollercoin/hamsters/pets/jack-o-mine/lvl${String(level).padStart(2, '0')}`;
  const walk = `${prefix}/sprite_walk.png`;
  for (const file of ['sprite_walk.png', 'idle.png', 'sprite_idle.png']) {
    assert(fs.existsSync(path.resolve(__dirname, '../public/assets', prefix, file)), `${prefix}/${file} is missing`);
  }
  return {
    level, walk, frames: 12, jump: null, jumpFrames: 0, frameWidth: 128, frameHeight: 128,
    idle: `${prefix}/idle.png`,
    idleAnimation: { path: `${prefix}/sprite_idle.png`, frames: 6, frameWidth: 160, frameHeight: 160, frameDurationMs: 100 },
    animations: { walk: { path: walk, frames: 12, frameWidth: 128, frameHeight: 128 } },
  };
});
const hamster = {
  slug: 'jack-o-mine', name: 'Jack O’Mine', generation: 2,
  order: existing?.order ?? Math.max(...catalog.map(item => item.order)) + 1,
  stats: { health: 70, strength: 60, luck: 90 },
  abilities: [
    { code: 'skip_rest_chest', text: labels('skipRestChest'), icon: 'rollercoin/hamsters/icons/skip_rest_chest.gif' },
    structuredClone(catalog.find(item => item.slug === 'eliza-bit').abilities.find(item => item.code === 'influencer')),
    structuredClone(catalog.find(item => item.slug === 'dusty-mcuncle').abilities.find(item => item.code === 'return_to_work')),
  ],
  builderSlots: [],
  ultimate: { code: 'extra_loot', text: labels('overchargedLoot'), icon: loot.icon },
  ultimateChargePoints: 18,
  ultimateTiers: [25, 50, 75].map((percent, index) => ({ tier: index + 1, chargeRequired: 18 + index * 6, text: textForLoot(percent) })),
  skins, animationsPending: true,
};
const index = catalog.findIndex(item => item.slug === hamster.slug);
if (index < 0) catalog.push(hamster);
else catalog[index] = hamster;
const set = sets.find(item => item.slug === 'night-shift-set');
assert(set, 'The Night Shift Set must exist');
if (!set.members.includes(hamster.slug)) set.members.push(hamster.slug);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(setsPath, `${JSON.stringify(sets, null, 2)}\n`);
console.log('Added Jack O’Mine: six appearances, official abilities and Night Shift membership.');
