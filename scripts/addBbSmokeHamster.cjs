// Official mechanics: https://rollercoin.com/blog/bb-smoke
// Run updateHamsterAbilityGuides.cjs and updateBbSmokeAssets.cjs first.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalogPath = path.resolve(__dirname, '../src/data/hamsters.json');
const setsPath = path.resolve(__dirname, '../src/data/hamsterSets.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
const existing = catalog.find(item => item.slug === 'bb-smoke');
const ability = (slug, code) => structuredClone(catalog.find(item => item.slug === slug).abilities.find(item => item.code === code));
// Reuse existing translations and swap the percentage.
const withPercent = (item, from, to) => ({ ...item, text: Object.fromEntries(Object.entries(item.text).map(([language, text]) => [language, text.replace(from, to)])) });
const languages = Object.keys(ability('joga-bonito', 'extra_loot').text);
const labels = key => Object.fromEntries(languages.map(language => {
  const locale = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../src/locales/${language}.json`), 'utf8'));
  const label = locale.hamsterAbilityGuide.labels[key];
  assert(label, `${language}: missing ${key}`);
  return [language, label];
}));
const minerPower = ['Miner Power', 'Madenci Gücü', 'Мощность майнеров', 'Miner-Leistung', 'Potencia de mineros', 'Puissance des mineurs', 'Poder dos mineradores', 'Daya Miner', '矿机算力', 'Výkon minerů'];

const skins = [1, 10, 20, 30, 40, 50].map(level => {
  const prefix = `rollercoin/hamsters/pets/bb-smoke/lvl${String(level).padStart(2, '0')}`;
  const frameCounts = { walk: 8, jump: 7, tap_reaction: 10, go_sleep: 24, take_chest: 9, win_loop: 6 };
  const animations = Object.fromEntries(Object.entries(frameCounts).map(([action, frames]) => [action, {
    path: `${prefix}/sprite_${action}.png`, frames, frameWidth: 128, frameHeight: 128,
  }]));
  for (const file of [...Object.values(animations).map(animation => animation.path), `${prefix}/idle.png`]) {
    assert(fs.existsSync(path.resolve(__dirname, '../public/assets', file)), `${file} is missing`);
  }
  return {
    level, walk: animations.walk.path, frames: animations.walk.frames,
    jump: animations.jump.path, jumpFrames: animations.jump.frames, frameWidth: 128, frameHeight: 128,
    idle: `${prefix}/idle.png`,
    animations,
  };
});

const hamster = {
  slug: 'bb-smoke', name: 'BB Smoke', generation: 2,
  order: existing?.order ?? Math.max(...catalog.map(item => item.order)) + 1,
  stats: { health: 50, strength: 70, luck: 90 },
  abilities: [
    { code: 'speed_up_walk', text: labels('speedUpWalk'), icon: 'rollercoin/hamsters/icons/speed_percent.webp' },
    withPercent(ability('joga-bonito', 'extra_loot'), '15', '25'),
    withPercent(ability('dusty-mcuncle', 'return_to_work'), '25', '20'),
  ],
  builderSlots: [],
  ultimate: { code: 'remote_power', text: labels('remotePowerUltimate'), icon: 'rollercoin/hamsters/icons/remote_power.webp' },
  ultimateChargePoints: 20,
  ultimateTiers: [[4, 20], [5, 30], [7, 42]].map(([multiplier, chargeRequired], index) => ({
    tier: index + 1, chargeRequired,
    text: Object.fromEntries(languages.map((language, i) => [language, `${minerPower[i]} ×${multiplier}`])),
  })),
  skins, animationsPending: false,
};
assert.equal(languages.length, minerPower.length);

const index = catalog.findIndex(item => item.slug === hamster.slug);
if (index < 0) catalog.push(hamster);
else catalog[index] = hamster;
const set = sets.find(item => item.slug === 'community-set');
assert(set, 'The Community Set must exist');
// The set was created before the hamster's name was known.
set.members = [...new Set(set.members.map(slug => (slug === 'bb-hamster' ? hamster.slug : slug)))];
assert(set.members.includes(hamster.slug));
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(setsPath, `${JSON.stringify(sets, null, 2)}\n`);
console.log('Added BB Smoke: six appearances, official abilities and Community Set membership.');
